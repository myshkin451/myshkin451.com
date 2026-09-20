import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

// This suite creates and removes users/content. It deliberately cannot target a hosted project.
const url = process.env.SUPABASE_URL
assert(
  url && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname),
  'Tests require a loopback SUPABASE_URL',
)
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
assert(anonKey && serviceKey, 'Provide local anonymous and service role keys via environment')
const dbContainer = process.env.SUPABASE_TEST_DB_CONTAINER
assert(
  dbContainer && /^[a-zA-Z0-9_.-]+$/.test(dbContainer),
  'Provide SUPABASE_TEST_DB_CONTAINER for verified-email and rolling-day rate-limit tests',
)
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}
const admin = createClient(url, serviceKey, options)
const anonymous = createClient(url, anonKey, options)
const users = []
const entries = []
const media = []
const messageIds = []
let originalSettings
let checks = 0
const suite = randomUUID().slice(0, 8)
const password = `Local-test-${randomUUID()}!`

function db(sql) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      dbContainer,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-Atc',
      sql,
    ],
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  )
}
function ok(result, label) {
  assert.equal(result.error, null, `${label}: ${result.error?.message}`)
  checks++
  return result.data
}
function denied(result, label) {
  assert(result.error, `${label}: unexpectedly succeeded`)
  checks++
}
function equal(actual, expected, label) {
  assert.deepEqual(actual, expected, label)
  checks++
}
async function user(name, confirmed = true) {
  const email = `api-${suite}-${name}@example.test`
  const created = ok(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: confirmed,
      user_metadata: { role: 'owner', is_owner: true, nickname: '  QA visitor  ' },
    }),
    `create ${name}`,
  )
  users.push(created.user.id)
  const client = createClient(url, anonKey, options)
  if (confirmed) ok(await client.auth.signInWithPassword({ email, password }), `login ${name}`)
  return { client, id: created.user.id, email }
}
function entry(kind = 'writing', extra = {}) {
  const id = randomUUID()
  entries.push(id)
  return {
    id,
    kind,
    title: `API test ${suite}`,
    summary: 'API permission fixture',
    body: 'Published original',
    topics: ['测试', '测试', ' '],
    cover: '',
    photos: [],
    destination: '',
    status: 'draft',
    createdAt: '',
    updatedAt: '',
    publishedAt: '',
    featured: false,
    discussion: true,
    sample: true,
    unexpectedSecret: 'strip this',
    ...extra,
  }
}
async function add(client, target, body, parent = null) {
  const result = ok(
    await client.rpc('add_message', { target_id: target, body, parent_id: parent }),
    `add ${body}`,
  )
  messageIds.push(result.id)
  return result
}
async function get(client, table, id) {
  return ok(await client.from(table).select('*').eq('id', id), `read ${table}`)
}
async function approved(owner, message) {
  ok(
    await owner.rpc('moderate_message', { message_id: message.id, status: 'approved' }),
    'approve message',
  )
}

try {
  const owner = await user('owner')
  const alice = await user('alice')
  const bob = await user('bob')
  const minute = await user('minute')
  const daily = await user('daily')
  const unverified = await user('unverified')
  ok(
    await admin.from('site_owners').insert({ user_id: owner.id }),
    'bootstrap owner with service role',
  )
  originalSettings = ok(
    await admin.from('site_settings').select('data').eq('id', true).single(),
    'read original settings',
  ).data

  equal(
    (await get(alice.client, 'profiles', alice.id))[0].nickname,
    'QA visitor',
    'profile sanitizes display nickname metadata',
  )
  equal(await get(alice.client, 'profiles', bob.id), [], 'profile isolation')
  equal(
    ok(await alice.client.from('site_owners').select('*'), 'visitor read roles'),
    [],
    'metadata cannot grant owner role',
  )
  equal(
    ok(await owner.client.from('site_owners').select('*'), 'owner read role').length,
    1,
    'owner can read own role',
  )
  denied(await anonymous.from('profiles').select('*'), 'anonymous profiles unavailable')
  denied(
    await alice.client.from('site_owners').insert({ user_id: alice.id }),
    'owner escalation denied',
  )
  denied(
    await alice.client.from('profiles').update({ nickname: 'spoof' }).eq('id', bob.id),
    'direct profile writes denied',
  )
  denied(
    await alice.client.rpc('save_profile', { nickname: 'spoof', id: bob.id }),
    'profile RPC cannot receive another identity',
  )
  ok(await alice.client.rpc('save_profile', { nickname: 'Alice' }), 'save own nickname')
  equal((await get(alice.client, 'profiles', alice.id))[0].nickname, 'Alice', 'own nickname saved')
  denied(await alice.client.rpc('save_profile', { nickname: 'x'.repeat(31) }), 'nickname length')
  denied(await alice.client.schema('private').rpc('is_owner'), 'private helpers not exposed by API')

  const note = entry('note', { title: '', body: '第一条随记。', discussion: false })
  denied(
    await anonymous.rpc('save_entry', { entry: note, publish: true }),
    'anonymous cannot publish notes',
  )
  denied(
    await alice.client.rpc('save_entry', { entry: note, publish: true }),
    'visitors cannot publish notes',
  )
  ok(await owner.client.rpc('save_entry', { entry: note }), 'save title-free note draft')
  equal(await get(anonymous, 'published_entries', note.id), [], 'note draft is private')
  equal(await get(bob.client, 'entry_drafts', note.id), [], 'second visitor cannot read note draft')
  denied(
    await owner.client.rpc('save_entry', { entry: { ...note, body: ' \n\t' }, publish: true }),
    'blank note rejected',
  )
  denied(
    await owner.client.rpc('save_entry', {
      entry: { ...note, body: '字'.repeat(5001) },
      publish: true,
    }),
    'long note rejected',
  )
  denied(
    await owner.client.rpc('save_entry', { entry: { ...note, body: '字'.repeat(5001) } }),
    'long note draft rejected',
  )
  const liveNote = ok(
    await owner.client.rpc('save_entry', {
      entry: { ...note, body: '🌙'.repeat(5000) },
      publish: true,
    }),
    'unicode codepoint note boundary accepted',
  )
  equal(
    (await get(anonymous, 'published_entries', note.id))[0].data.title,
    '',
    'note never requires invented title',
  )
  equal(
    (await get(anonymous, 'published_entries', note.id))[0].data.body,
    liveNote.body,
    'note body is public',
  )
  denied(
    await bob.client.rpc('add_message', { target_id: note.id, body: 'not allowed' }),
    'notes can close discussion',
  )
  ok(
    await owner.client.rpc('save_entry', { entry: { ...note, body: '未公开修改' } }),
    'revise note privately',
  )
  equal(
    (await get(anonymous, 'published_entries', note.id))[0].data.body,
    liveNote.body,
    'private revision does not leak',
  )
  const revision = ok(
    await owner.client.rpc('save_entry', { entry: { ...note, body: '公开修改' }, publish: true }),
    'publish note revision',
  )
  equal(revision.publishedAt, liveNote.publishedAt, 'note edit retains chronological position')
  equal(
    (await get(bob.client, 'published_entries', note.id))[0].data.body,
    '公开修改',
    'independent visitor sees revision',
  )
  denied(
    await alice.client.rpc('unpublish_entry', { entry_id: note.id }),
    'visitor cannot withdraw notes',
  )
  ok(await owner.client.rpc('unpublish_entry', { entry_id: note.id }), 'owner withdraws note')
  equal(
    await get(anonymous, 'published_entries', note.id),
    [],
    'withdrawn note disappears publicly',
  )
  equal(
    (await get(owner.client, 'entry_drafts', note.id))[0].data.body,
    '公开修改',
    'withdrawn note retained privately',
  )
  const restoredNote = ok(
    await owner.client.rpc('save_entry', { entry: note, publish: true }),
    'republish withdrawn note',
  )
  equal(restoredNote.publishedAt, liveNote.publishedAt, 'republish retains original note date')

  const article = entry()
  denied(
    await anonymous.rpc('save_entry', { entry: article, publish: true }),
    'anonymous publishing denied',
  )
  denied(
    await alice.client.rpc('save_entry', { entry: article, publish: true }),
    'visitor publishing denied',
  )
  denied(
    await alice.client.rpc('save_settings', { settings: originalSettings }),
    'visitor settings writes denied',
  )
  denied(
    await owner.client.from('published_entries').insert({ id: article.id, data: article }),
    'even owner direct content DML denied',
  )
  const draft = ok(await owner.client.rpc('save_entry', { entry: article }), 'owner save draft')
  equal(draft.status, 'draft', 'server controls draft status')
  equal(draft.sample, false, 'server strips sample marker')
  equal(draft.unexpectedSecret, undefined, 'server strips unknown JSON fields')
  equal(draft.topics, ['测试'], 'server normalizes topics')
  denied(await anonymous.from('entry_drafts').select('*'), 'anonymous draft table unavailable')
  equal(await get(alice.client, 'entry_drafts', article.id), [], 'visitor draft rows unavailable')
  equal(await get(anonymous, 'published_entries', article.id), [], 'draft absent publicly')
  equal((await get(owner.client, 'entry_drafts', article.id)).length, 1, 'owner sees draft')
  denied(
    await alice.client.rpc('add_message', { target_id: article.id, body: 'Draft comment' }),
    'comments cannot target drafts',
  )
  denied(
    await owner.client.rpc('save_entry', {
      entry: { ...article, cover: '/media/not-real.png' },
      publish: true,
    }),
    'invalid media rejected',
  )
  denied(
    await owner.client.rpc('save_entry', {
      entry: { ...article, destination: 'javascript:alert(1)' },
      publish: true,
    }),
    'unsafe project links rejected',
  )
  denied(
    await owner.client.rpc('save_entry', { entry: { ...article, title: '' }, publish: true }),
    'empty publish rejected',
  )
  const published = ok(
    await owner.client.rpc('save_entry', { entry: article, publish: true }),
    'owner publish',
  )
  equal(published.status, 'published', 'server controls published status')
  equal(
    (await get(anonymous, 'published_entries', article.id))[0].data.body,
    'Published original',
    'anonymous reads public content',
  )
  equal(await get(owner.client, 'entry_drafts', article.id), [], 'publish consumes draft')
  ok(
    await owner.client.rpc('save_entry', {
      entry: { ...published, body: 'Private revision' },
      publish: false,
    }),
    'save private revision',
  )
  equal(
    (await get(anonymous, 'published_entries', article.id))[0].data.body,
    'Published original',
    'draft revisions do not leak',
  )
  equal(
    (await get(owner.client, 'entry_drafts', article.id))[0].data.body,
    'Private revision',
    'owner sees private revision',
  )

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=',
    'base64',
  )
  const objectName = `${randomUUID()}.png`
  media.push(objectName)
  denied(
    await anonymous.storage.from('media').upload(objectName, png, { contentType: 'image/png' }),
    'anonymous upload denied',
  )
  denied(
    await alice.client.storage.from('media').upload(objectName, png, { contentType: 'image/png' }),
    'visitor upload denied',
  )
  ok(
    await owner.client.storage.from('media').upload(objectName, png, { contentType: 'image/png' }),
    'owner image upload',
  )
  denied(
    await owner.client.storage
      .from('media')
      .upload(objectName, png, { contentType: 'image/png', upsert: true }),
    'media overwrite denied',
  )
  denied(
    await owner.client.storage
      .from('media')
      .upload(`${randomUUID()}.svg`, '<svg/>', { contentType: 'image/svg+xml' }),
    'SVG upload denied',
  )
  denied(
    await owner.client.storage
      .from('media')
      .upload('unscoped.png', png, { contentType: 'image/png' }),
    'noncanonical media names denied',
  )
  denied(await anonymous.storage.from('media').download(objectName), 'unpublished media private')
  denied(
    await alice.client.storage.from('media').createSignedUrl(objectName, 60),
    'visitor cannot sign unpublished media',
  )
  const album = entry('photo', {
    body: '',
    cover: `/media/${objectName}`,
    photos: [{ id: randomUUID(), src: `/media/${objectName}`, alt: 'test pixel', caption: '' }],
  })
  ok(await owner.client.rpc('save_entry', { entry: album }), 'photo draft saved')
  denied(await anonymous.storage.from('media').download(objectName), 'draft media still private')
  ok(await owner.client.rpc('save_entry', { entry: album, publish: true }), 'photo published')
  const download = ok(
    await anonymous.storage.from('media').download(objectName),
    'published image anonymous read',
  )
  equal(Buffer.from(await download.arrayBuffer()), png, 'stored media bytes preserved')
  const attemptedRemoval = await owner.client.storage.from('media').remove([objectName])
  // Storage remove can report an empty successful result when RLS filters every row.
  assert(
    attemptedRemoval.error || attemptedRemoval.data.length === 0,
    'owner must not remove immutable media',
  )
  checks++
  ok(
    await anonymous.storage.from('media').download(objectName),
    'public image survives denied removal',
  )
  const privateObject = `${randomUUID()}.png`
  media.push(privateObject)
  ok(
    await owner.client.storage
      .from('media')
      .upload(privateObject, png, { contentType: 'image/png' }),
    'new revision image upload',
  )
  ok(
    await owner.client.rpc('save_entry', {
      entry: {
        ...album,
        cover: `/media/${privateObject}`,
        photos: [{ ...album.photos[0], src: `/media/${privateObject}` }],
      },
    }),
    'save changed photo draft',
  )
  denied(
    await anonymous.storage.from('media').download(privateObject),
    'new draft image does not leak through old publication',
  )
  ok(
    await anonymous.storage.from('media').download(objectName),
    'published image remains available',
  )
  ok(await owner.client.rpc('unpublish_entry', { entry_id: album.id }), 'withdraw photo')
  denied(
    await anonymous.storage.from('media').download(objectName),
    'withdrawal revokes new image reads',
  )
  equal(
    (await get(owner.client, 'entry_drafts', album.id))[0].data.cover,
    `/media/${privateObject}`,
    'withdraw preserves edited draft',
  )

  db(`update auth.users set email_confirmed_at = null where id = '${unverified.id}'`)
  denied(
    await unverified.client.rpc('add_message', { target_id: 'guestbook', body: 'Unverified' }),
    'server checks verified email beyond stale JWT',
  )
  denied(
    await anonymous.rpc('add_message', { target_id: 'guestbook', body: 'Anonymous' }),
    'anonymous messaging denied',
  )
  denied(
    await alice.client.from('messages').insert({
      target_id: 'guestbook',
      author_id: owner.id,
      author_name: 'Owner',
      body: 'spoof',
      status: 'approved',
    }),
    'author and moderation spoof denied',
  )
  const a = await add(alice.client, article.id, 'Alice pending')
  equal(a.author_id, alice.id, 'author derived from session')
  equal(a.author_name, 'Alice', 'author name derived from profile')
  equal(a.status, 'pending', 'visitors start pending')
  equal(await get(anonymous, 'messages', a.id), [], 'pending message hidden anonymously')
  equal(await get(bob.client, 'messages', a.id), [], 'pending message hidden from another visitor')
  equal((await get(alice.client, 'messages', a.id)).length, 1, 'author sees own pending')
  equal((await get(owner.client, 'messages', a.id)).length, 1, 'owner sees pending')
  denied(
    await bob.client.rpc('edit_message', { message_id: a.id, body: 'hijack' }),
    'other visitor edit denied',
  )
  denied(
    await bob.client.rpc('delete_message', { message_id: a.id }),
    'other visitor delete denied',
  )
  denied(
    await bob.client.rpc('moderate_message', { message_id: a.id, status: 'approved' }),
    'visitor moderation denied',
  )
  denied(
    await bob.client.rpc('add_message', {
      target_id: article.id,
      parent_id: a.id,
      body: 'pending reply',
    }),
    'cannot reply to pending message',
  )
  await approved(owner.client, a)
  equal((await get(anonymous, 'messages', a.id)).length, 1, 'approved message public')
  denied(
    await bob.client.rpc('add_message', {
      target_id: 'guestbook',
      parent_id: a.id,
      body: 'wrong target',
    }),
    'cross-target replies denied',
  )
  const reply = await add(bob.client, article.id, 'Bob reply', a.id)
  await approved(owner.client, reply)
  ok(
    await alice.client.rpc('edit_message', { message_id: a.id, body: 'Alice revised' }),
    'author edits own message',
  )
  equal(await get(anonymous, 'messages', a.id), [], 'visitor edit re-enters moderation')
  await approved(owner.client, a)
  ok(
    await owner.client.rpc('moderate_message', { message_id: a.id, status: 'hidden' }),
    'owner hides message',
  )
  equal(await get(anonymous, 'messages', a.id), [], 'hidden message absent publicly')
  equal(
    (await get(alice.client, 'messages', a.id))[0].status,
    'hidden',
    'author sees hidden status',
  )
  await approved(owner.client, a)
  ok(
    await alice.client.rpc('delete_message', { message_id: a.id }),
    'author deletes replied-to message',
  )
  const tombstone = (await get(anonymous, 'messages', a.id))[0]
  equal(
    [tombstone.author_id, tombstone.author_name, tombstone.body],
    [null, '已删除', '留言已删除'],
    'delete preserves reply context without original text or author',
  )
  equal(
    (await get(anonymous, 'messages', reply.id))[0].parent_id,
    a.id,
    'reply relationship survives delete',
  )
  const ownerMessage = await add(owner.client, 'guestbook', 'Owner response')
  equal(ownerMessage.status, 'approved', 'owner response immediately visible')
  const withdrawn = await add(alice.client, article.id, 'Withdraw later')
  await approved(owner.client, withdrawn)
  ok(
    await owner.client.rpc('save_entry', {
      entry: { ...published, discussion: false },
      publish: true,
    }),
    'close discussion',
  )
  equal(await get(anonymous, 'messages', withdrawn.id), [], 'closing discussion hides old messages')
  denied(
    await bob.client.rpc('add_message', { target_id: article.id, body: 'closed' }),
    'closed discussion rejects creation',
  )
  ok(await owner.client.rpc('unpublish_entry', { entry_id: article.id }), 'withdraw article')
  equal(
    await get(anonymous, 'published_entries', article.id),
    [],
    'withdrawn article absent publicly',
  )
  equal(
    (await get(alice.client, 'messages', withdrawn.id)).length,
    1,
    'own withdrawn-target message remains manageable',
  )
  ok(
    await alice.client.rpc('delete_message', { message_id: withdrawn.id }),
    'own delete works after withdrawal',
  )
  equal(
    await get(alice.client, 'messages', withdrawn.id),
    [],
    'withdrawn-target own deletion persisted',
  )

  const burst = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      minute.client.rpc('add_message', { target_id: 'guestbook', body: `concurrent-${i}` }),
    ),
  )
  const accepted = burst.filter((r) => !r.error)
  messageIds.push(...accepted.map((r) => r.data.id))
  equal(accepted.length, 5, 'concurrent minute rate limit cannot race')
  equal(
    burst.filter((r) => r.error?.message.includes('过于频繁')).length,
    7,
    'rate rejection is explicit',
  )
  denied(
    await minute.client.rpc('edit_message', {
      message_id: accepted[0].data.id,
      body: 'bypass with edit',
    }),
    'edit shares create rate quota',
  )
  db(
    `insert into private.message_events(user_id, occurred_at) select '${daily.id}', now() - interval '2 hours' from generate_series(1, 30)`,
  )
  denied(
    await daily.client.rpc('add_message', { target_id: 'guestbook', body: 'day limit' }),
    'rolling day limit enforced',
  )
  db(
    `update private.message_events set occurred_at = now() - interval '25 hours' where user_id = '${daily.id}'`,
  )
  await add(daily.client, 'guestbook', 'Expired rate events do not block')

  const settings = { name: 'API Test', intro: '', about: '', homeView: 'list', private: 'strip me' }
  const savedSettings = ok(
    await owner.client.rpc('save_settings', { settings }),
    'owner saves settings',
  )
  equal(savedSettings.private, undefined, 'settings allowlist')
  equal(
    ok(await anonymous.from('site_settings').select('data').single(), 'public settings').data
      .homeView,
    'list',
    'settings readable without account',
  )
  ok(
    await owner.client.rpc('save_settings', { settings: originalSettings }),
    'restore original settings',
  )
  denied(
    await alice.client.rpc('delete_entry', { entry_id: article.id }),
    'visitor content deletion denied',
  )
  ok(await owner.client.rpc('delete_entry', { entry_id: article.id }), 'owner deletes content')
  equal(await get(owner.client, 'entry_drafts', article.id), [], 'delete removes draft')
  console.log(
    `PASS: ${checks} real API assertions (anonymous, owner, two visitors, unverified identity, concurrent and rolling-day rate limits; private media).`,
  )
} finally {
  // Delete only IDs created by this run; never reset the development project.
  if (messageIds.length) {
    ok(
      await admin.from('messages').delete().in('id', messageIds).not('parent_id', 'is', null),
      'cleanup replies',
    )
    ok(await admin.from('messages').delete().in('id', messageIds), 'cleanup messages')
  }
  for (const table of ['entry_drafts', 'published_entries']) {
    if (entries.length) ok(await admin.from(table).delete().in('id', entries), `cleanup ${table}`)
  }
  if (originalSettings)
    ok(
      await admin.from('site_settings').update({ data: originalSettings }).eq('id', true),
      'cleanup settings',
    )
  if (media.length) ok(await admin.storage.from('media').remove(media), 'cleanup media')
  for (const id of users) ok(await admin.auth.admin.deleteUser(id), 'cleanup user')
}
