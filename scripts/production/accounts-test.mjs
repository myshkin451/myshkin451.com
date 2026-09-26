import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

// Only isolated synthetic accounts are changed; never reset an existing database.
const url = process.env.SUPABASE_URL
assert(
  url && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname),
  'Loopback backend required',
)
const container = process.env.SUPABASE_TEST_DB_CONTAINER
assert(container === 'supabase_db_myshkin451-production', 'Expected local test database')
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
assert(anonKey && serviceKey, 'Local keys required')
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}
const admin = createClient(url, serviceKey, options)
const anonymous = createClient(url, anonKey, options)
const users = []
const draftId = randomUUID()
const mediaName = `${randomUUID()}.png`
let draftCreated = false
let mediaCreated = false
const suite = randomUUID()
const password = `Local-${randomUUID()}!`
let checks = 0
function db(sql) {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      container,
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
  ).trim()
}
function ok(result) {
  assert.equal(result.error, null, result.error?.message)
  checks++
  return result.data
}
function denied(result) {
  assert(result.error, 'Expected permission/validation failure')
  checks++
}
function equal(actual, expected) {
  assert.deepEqual(actual, expected)
  checks++
}
async function user(name) {
  const email = `accounts-${suite}-${name}@example.test`
  const created = ok(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nickname: name, role: 'owner' },
    }),
  )
  users.push(created.user.id)
  const client = createClient(url, anonKey, options)
  ok(await client.auth.signInWithPassword({ email, password }))
  return { id: created.user.id, client, email }
}
const access = (client, target, owner, restricted) =>
  client.rpc('set_account_access', { target_id: target.id, owner, restricted })
try {
  const owner = await user('owner')
  const visitor = await user('visitor')
  const second = await user('second')
  const unverified = await user('unverified')
  ok(await admin.from('site_owners').insert({ user_id: owner.id }))
  denied(await anonymous.rpc('account_status'))
  denied(await anonymous.rpc('list_accounts'))
  denied(
    await anonymous.rpc('set_account_access', {
      target_id: visitor.id,
      owner: true,
      restricted: false,
    }),
  )
  denied(await visitor.client.rpc('list_accounts'))
  denied(await access(visitor.client, visitor, true, false))
  const status = ok(await visitor.client.rpc('account_status'))
  equal(Object.keys(status).sort(), [
    'created_at',
    'email',
    'email_confirmed_at',
    'id',
    'restricted',
    'role',
  ])
  equal(status.id, visitor.id)
  equal(status.role, 'visitor')
  equal(status.restricted, false)
  const listing = ok(await owner.client.rpc('list_accounts'))
  equal(listing.accounts.length <= 50, true)
  equal(typeof listing.has_more, 'boolean')
  equal(Object.keys(listing.accounts[0]).sort(), [
    'created_at',
    'email',
    'email_confirmed_at',
    'id',
    'last_sign_in_at',
    'nickname',
    'restricted',
    'role',
  ])
  denied(await owner.client.rpc('list_accounts', { page_number: -1 }))
  denied(await access(owner.client, owner, false, false))
  denied(await access(owner.client, owner, true, true))
  denied(await access(owner.client, { id: randomUUID() }, true, false))
  db(`update auth.users set email_confirmed_at = null where id = '${unverified.id}'`)
  denied(await access(owner.client, unverified, true, false))
  denied(await unverified.client.rpc('save_profile', { nickname: 'Forbidden' }))
  // Even an out-of-band owner row cannot make an unverified identity effective.
  ok(await admin.from('site_owners').insert({ user_id: unverified.id }))
  equal(ok(await unverified.client.from('site_owners').select('*')), [])
  denied(await unverified.client.rpc('list_accounts'))
  ok(await access(owner.client, visitor, false, true))
  equal(ok(await visitor.client.rpc('account_status')).restricted, true)
  denied(await visitor.client.rpc('save_profile', { nickname: 'Forbidden' }))
  denied(await visitor.client.rpc('add_message', { target_id: 'guestbook', body: 'Forbidden' }))
  denied(await access(visitor.client, second, true, false))
  ok(await access(owner.client, visitor, false, false))
  ok(await visitor.client.rpc('save_profile', { nickname: 'Restored' }))
  ok(await access(owner.client, second, true, false))
  equal(ok(await second.client.rpc('account_status')).role, 'owner')
  ok(await second.client.rpc('list_accounts'))
  // Verify real RLS reads and Storage signing with the same already-issued JWT.
  ok(await admin.from('entry_drafts').insert({ id: draftId, data: { id: draftId } }))
  draftCreated = true
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=',
    'base64',
  )
  ok(await owner.client.storage.from('media').upload(mediaName, png, { contentType: 'image/png' }))
  mediaCreated = true
  equal(ok(await second.client.from('entry_drafts').select('id').eq('id', draftId)), [
    { id: draftId },
  ])
  ok(await second.client.storage.from('media').createSignedUrl(mediaName, 60))
  ok(await access(owner.client, second, false, true))
  equal(ok(await second.client.from('entry_drafts').select('id').eq('id', draftId)), [])
  denied(await second.client.storage.from('media').createSignedUrl(mediaName, 60))
  denied(await second.client.storage.from('media').download(mediaName))
  ok(await access(owner.client, second, true, false))
  equal(ok(await second.client.from('entry_drafts').select('id').eq('id', draftId)), [
    { id: draftId },
  ])
  ok(await second.client.storage.from('media').createSignedUrl(mediaName, 60))
  ok(await access(owner.client, second, false, false))
  denied(await second.client.rpc('list_accounts'))
  equal(ok(await second.client.from('site_owners').select('*')), [])
  // Auth bans must invalidate application permissions for an already-issued JWT.
  ok(await access(owner.client, second, true, false))
  db(`update auth.users set banned_until = now() + interval '1 day' where id = '${second.id}'`)
  denied(await second.client.rpc('list_accounts'))
  denied(await second.client.rpc('save_profile', { nickname: 'Forbidden' }))
  equal(ok(await second.client.from('entry_drafts').select('id').eq('id', draftId)), [])
  denied(await second.client.storage.from('media').createSignedUrl(mediaName, 60))
  denied(await access(owner.client, second, true, false))
  equal(ok(await second.client.from('site_owners').select('*')), [])
  db(`update auth.users set banned_until = null where id = '${second.id}'`)
  // Concurrent cross-revocation must leave exactly one of these owners effective.
  const results = await Promise.all([
    access(owner.client, second, false, false),
    access(second.client, owner, false, false),
  ])
  equal(results.filter((result) => !result.error).length, 1)
  equal(
    db(`select count(*) from public.site_owners where user_id in ('${owner.id}', '${second.id}')`),
    '1',
  )
  const events = JSON.parse(
    db(
      `select coalesce(jsonb_agg(to_jsonb(e)), '[]') from private.account_access_events e where actor_id in ('${owner.id}', '${second.id}')`,
    ),
  )
  equal(events.length >= 6, true)
  equal(
    events.every((event) => users.includes(event.actor_id) && users.includes(event.target_id)),
    true,
  )
  console.log(`Account permission checks passed: ${checks}`)
} finally {
  // Delete only fixtures created by this run, including their private audit rows.
  if (draftCreated) ok(await admin.from('entry_drafts').delete().eq('id', draftId))
  if (mediaCreated) ok(await admin.storage.from('media').remove([mediaName]))
  if (users.length) {
    const ids = users.map((id) => `'${id}'`).join(',')
    db(
      `delete from private.account_access_events where actor_id in (${ids}) or target_id in (${ids})`,
    )
  }
  for (const id of users) {
    const result = await admin.auth.admin.deleteUser(id)
    assert.equal(result.error, null, 'Synthetic account cleanup failed')
  }
}
