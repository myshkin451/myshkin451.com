#!/usr/bin/env node
import { randomBytes } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import {
  assertMatchingAccounts,
  configuration,
  ensureOutsideRepository,
  fileHash,
  fingerprints,
  mediaObjects,
  migrations,
  objectRoute,
  options,
  pgTool,
  query,
  request,
  schema,
  sha256,
  sqlString,
  tables,
} from './backup.mjs'

const defaultSettings = { name: 'Myshkin 451', intro: '', about: '', homeView: 'grid' }
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const digest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

export function assertBucketConfiguration(bucket, expected) {
  if (bucket.public !== false) throw new Error('Target media bucket must be private')
  const mimeTypes = (value) => {
    if (value == null) return null
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
      throw new Error('Invalid media bucket MIME restrictions')
    return [...new Set(value)].sort()
  }
  if (
    (bucket.file_size_limit ?? null) !== (expected.fileSizeLimit ?? null) ||
    !same(mimeTypes(bucket.allowed_mime_types), mimeTypes(expected.allowedMimeTypes))
  ) {
    throw new Error(
      'Target media bucket limits differ from backup; configure the isolated target first',
    )
  }
}

async function archiveFile(directory, relative) {
  const location = path.resolve(directory, relative)
  if (!location.startsWith(directory + path.sep))
    throw new Error('Archive path escapes its directory')
  const stat = await lstat(location)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077) {
    throw new Error(
      'Archive files must be regular private files (chmod 600); symlinks are forbidden',
    )
  }
  if ((await realpath(location)) !== location)
    throw new Error('Archive paths must not contain symlinks')
  return location
}

async function verify(directory) {
  const root = await lstat(directory)
  if (!root.isDirectory() || root.isSymbolicLink() || root.mode & 0o077) {
    throw new Error('Archive directory must be private (chmod 700) and not a symlink')
  }
  await ensureOutsideRepository(directory)
  const manifestFile = await archiveFile(directory, 'manifest.json')
  const checksumFile = await archiveFile(directory, 'manifest.sha256')
  const source = await readFile(manifestFile, 'utf8')
  if (sha256(source) !== (await readFile(checksumFile, 'utf8')).trim())
    throw new Error('Manifest checksum mismatch')
  const manifest = JSON.parse(source)
  if (manifest.format !== 'myshkin451-email-password-backup' || manifest.version !== 1)
    throw new Error('Unsupported archive format')
  if (!same(manifest.tables, tables))
    throw new Error('Archive table scope does not match this application')
  if (!same(manifest.migrations, await migrations()))
    throw new Error('Checkout the backup migration version before restoring')
  if (manifest.database?.file !== 'database.sql' || !digest(manifest.database.sha256))
    throw new Error('Invalid database manifest')
  if (manifest.bucket?.id !== 'media' || manifest.bucket.public !== false)
    throw new Error('Invalid media bucket manifest')
  if (!Array.isArray(manifest.media) || !Array.isArray(manifest.columns))
    throw new Error('Invalid archive manifest')
  for (const table of tables) {
    const stats = manifest.rows?.[table]
    if (
      !Number.isSafeInteger(stats?.count) ||
      stats.count < 0 ||
      !/^[a-f0-9]{32}$/.test(stats.digest)
    ) {
      throw new Error('Invalid table integrity manifest')
    }
  }
  const databaseFile = await archiveFile(directory, 'database.sql')
  if ((await fileHash(databaseFile)) !== manifest.database.sha256)
    throw new Error('Database checksum mismatch')
  const paths = new Set()
  for (const [index, object] of manifest.media.entries()) {
    if (
      typeof object.name !== 'string' ||
      !object.name ||
      object.name.split('/').some((part) => !part || part === '..' || part === '.') ||
      paths.has(object.name) ||
      /[\u0000-\u001f\u007f]/.test(object.name) ||
      object.file !== `objects/${String(index).padStart(8, '0')}.bin` ||
      !digest(object.sha256) ||
      !Number.isSafeInteger(object.size) ||
      object.size < 0 ||
      typeof object.contentType !== 'string' ||
      /[\r\n]/.test(object.contentType) ||
      !/^\d+$/.test(object.cacheControl)
    )
      throw new Error('Invalid media manifest')
    paths.add(object.name)
    const file = await archiveFile(directory, object.file)
    if ((await lstat(file)).size !== object.size || (await fileHash(file)) !== object.sha256)
      throw new Error('Media checksum mismatch')
  }
  return { manifest, databaseFile }
}

function emptyCheckSQL() {
  return `DO $guard$ BEGIN
    ${tables
      .filter((table) => table !== 'public.site_settings')
      .map(
        (table) =>
          `IF EXISTS (SELECT FROM ${table}) THEN RAISE EXCEPTION 'Target is not empty'; END IF;`,
      )
      .join('\n')}
    IF EXISTS (SELECT FROM public.site_settings WHERE id IS DISTINCT FROM true OR data IS DISTINCT FROM ${sqlString(JSON.stringify(defaultSettings))}::jsonb)
      THEN RAISE EXCEPTION 'Target has non-default settings'; END IF;
    IF EXISTS (SELECT FROM auth.sessions) OR EXISTS (SELECT FROM auth.refresh_tokens)
      THEN RAISE EXCEPTION 'Target has auth sessions'; END IF;
    END $guard$;`
}

export async function assertTargetBinding(config) {
  const marker = { ...defaultSettings, _restore_target_probe: randomBytes(32).toString('hex') }
  const originalSQL = `${sqlString(JSON.stringify(defaultSettings))}::jsonb`
  const markerSQL = `${sqlString(JSON.stringify(marker))}::jsonb`
  let installed = false
  try {
    // Commit only this temporary marker so PostgREST can observe it. Never insert a missing row.
    const changed = await query(
      config,
      `BEGIN;
      LOCK TABLE ${tables.join(',')} IN ACCESS EXCLUSIVE MODE;
      ${emptyCheckSQL()}
      WITH changed AS (
        UPDATE public.site_settings SET data = ${markerSQL}
        WHERE id = true AND data = ${originalSQL} RETURNING id
      ) SELECT count(*) FROM changed;
      COMMIT;`,
    )
    if (changed !== 1) throw new Error('Target binding requires the migration default settings row')
    installed = true
    const rows = await (
      await request(config, '/rest/v1/site_settings?id=eq.true&select=id,data', {
        headers: { 'Cache-Control': 'no-store' },
      })
    ).json()
    if (
      !Array.isArray(rows) ||
      rows.length !== 1 ||
      rows[0].id !== true ||
      !isDeepStrictEqual(rows[0].data, marker)
    ) {
      throw new Error('Target API and database binding failed; no account or media import started')
    }
  } finally {
    // Also attempt cleanup after an uncertain commit. Compare the entire value, preserving any
    // concurrent edit; a failed/contested cleanup aborts the restore instead of resetting it.
    const cleaned = await query(
      config,
      `WITH cleaned AS (
        UPDATE public.site_settings SET data = ${originalSQL}
        WHERE id = true AND data = ${markerSQL} RETURNING id
      ) SELECT count(*) FROM cleaned;`,
    )
    if (installed && cleaned !== 1) {
      throw new Error('Target settings changed during binding verification; keep target isolated')
    }
  }
  await pgTool(config, 'psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'], { input: emptyCheckSQL() })
}

function restoredIntegritySQL(manifest) {
  return `DO $integrity$ BEGIN
    ${tables
      .map(
        (table) => `IF (SELECT count(*) FROM ${table}) <> ${manifest.rows[table].count}
      OR (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) FROM ${table} t)
      <> ${sqlString(manifest.rows[table].digest)} THEN RAISE EXCEPTION 'Restored rows differ from backup'; END IF;`,
      )
      .join('\n')}
    END $integrity$;`
}

async function restore() {
  const args = options(
    process.argv.slice(2),
    ['--from', '--remote', '--confirm-target'],
    ['--quiesced', '--help', '--verify-only'],
  )
  if (args['--help']) {
    console.log(
      'Verify without connecting: node scripts/production/restore.mjs --from /private/path/backup --verify-only\nRestore: node --env-file=/private/path/target.env scripts/production/restore.mjs --from /private/path/backup --confirm-target http://127.0.0.1:55421 --quiesced\nRemote targets also need --remote https://PROJECT.supabase.co. Target must be empty and migrated; this tool never overwrites an existing site.',
    )
    return
  }
  if (!args['--from']) throw new Error('Provide --from pointing to a trusted private archive')
  process.umask(0o077)
  const suppliedDirectory = path.resolve(args['--from'])
  if ((await lstat(suppliedDirectory)).isSymbolicLink())
    throw new Error('Archive directory must not be a symlink')
  const directory = await realpath(suppliedDirectory)
  const { manifest, databaseFile } = await verify(directory)
  if (args['--verify-only']) {
    console.log(
      `Archive integrity verified: ${manifest.media.length} media objects; no service was contacted. This is not a restore drill.`,
    )
    return
  }
  const config = configuration(args, 'restore')
  if (!same(await schema(config), manifest.columns))
    throw new Error('Target table columns differ; use matching Supabase and migration versions')
  await pgTool(config, 'psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'], { input: emptyCheckSQL() })
  const bucket = await (await request(config, '/storage/v1/bucket/media')).json()
  assertBucketConfiguration(bucket, manifest.bucket)
  if ((await mediaObjects(config)).length) throw new Error('Target media bucket is not empty')
  // Check API emptiness too: detect a DB/API configuration pointing at different populated projects.
  const authPage = await (await request(config, '/auth/v1/admin/users?page=1&per_page=1')).json()
  if (!Array.isArray(authPage.users) || authPage.users.length)
    throw new Error('Target API already has accounts')
  const storagePage = await (
    await request(config, '/storage/v1/object/list/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1 }),
    })
  ).json()
  if (!Array.isArray(storagePage) || storagePage.length)
    throw new Error('Target API media bucket is not empty')
  // Probe privileges before uploading. A read-only role must not leave partial storage data.
  await pgTool(config, 'psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'], {
    input: 'BEGIN; SET LOCAL session_replication_role = replica; ROLLBACK;',
  })
  // Empty API and DB checks alone cannot distinguish two different empty projects.
  await assertTargetBinding(config)
  for (const object of manifest.media) {
    const content = await readFile(path.join(directory, object.file))
    await request(config, objectRoute(object.name), {
      method: 'POST',
      headers: {
        'Content-Type': object.contentType,
        'Cache-Control': `max-age=${object.cacheControl}`,
        'x-upsert': 'false',
      },
      body: content,
    })
    const downloaded = Buffer.from(
      await (await request(config, objectRoute(object.name))).arrayBuffer(),
    )
    if (sha256(downloaded) !== object.sha256)
      throw new Error('Uploaded media verification failed; target remains offline')
  }
  const tokenColumns = manifest.columns
    .filter(
      (column) =>
        column.table_schema === 'auth' &&
        column.table_name === 'users' &&
        [
          'confirmation_token',
          'recovery_token',
          'email_change_token_new',
          'email_change_token_current',
          'reauthentication_token',
          'phone_change_token',
        ].includes(column.column_name),
    )
    .map((column) => `${column.column_name} = ''`)
  const prefix = `BEGIN;
    LOCK TABLE ${tables.join(',')} IN ACCESS EXCLUSIVE MODE;
    ${emptyCheckSQL()}
    SET LOCAL session_replication_role = replica;
    DELETE FROM public.site_settings;
  `
  const suffix = `
    ${restoredIntegritySQL(manifest)}
    ${tokenColumns.length ? `UPDATE auth.users SET ${tokenColumns.join(',')};` : ''}
    COMMIT;
  `
  const sql = Readable.from(
    (async function* () {
      yield prefix
      yield* createReadStream(databaseFile)
      yield suffix
    })(),
  )
  await pgTool(config, 'psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'], { input: sql })
  const restored = await fingerprints(config)
  if (tables.some((table) => restored[table].count !== manifest.rows[table].count))
    throw new Error('Post-restore counts differ; keep target offline')
  await assertMatchingAccounts(config)
  console.log(
    `Restore complete: ${manifest.rows['auth.users'].count} accounts, ${manifest.media.length} verified media objects. Sessions and old one-time email links were not restored. Keep the target offline until login, permissions and publishing checks pass.`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  restore().catch((error) => {
    console.error(
      `Restore failed: ${error.message}\nNo existing site data is overwritten. A failed run may have left a binding marker or uploaded media in the initially empty target; inspect that isolated target before retrying. Never clear production data to make this script pass.`,
    )
    process.exitCode = 1
  })
}
