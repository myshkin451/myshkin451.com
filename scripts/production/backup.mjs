#!/usr/bin/env node
// Application recovery archive. Not a full Supabase platform clone; see RUNBOOK.md.
import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { access, lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'

export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const tables = [
  'auth.users',
  'auth.identities',
  'public.profiles',
  'public.site_owners',
  'public.published_entries',
  'public.entry_drafts',
  'public.site_settings',
  'public.messages',
  'private.message_events',
  'private.account_access',
  'private.account_access_events',
]

const executeFile = promisify(execFile)

export async function backupMetadata(config) {
  let git = { commit: null, dirty: null }
  try {
    const { stdout: commit } = await executeFile('git', ['rev-parse', 'HEAD'], { cwd: repository })
    const { stdout: status } = await executeFile('git', ['status', '--porcelain'], {
      cwd: repository,
    })
    if (/^[a-f0-9]{40,64}$/.test(commit.trim())) {
      git = { commit: commit.trim(), dirty: Boolean(status.trim()) }
    }
  } catch {
    // Source archives may not contain Git metadata. Never save command errors or paths.
  }
  const postgres = await query(config, `SELECT to_json(current_setting('server_version'));`)
  const pgDump = await pgTool(config, 'pg_dump', ['--version'])
  const psql = await pgTool(config, 'psql', ['--version'])
  return { git, tools: { node: process.version, pgDump, psql }, postgres }
}

export function options(argv, valueNames, flagNames = ['--quiesced', '--help']) {
  const result = {}
  for (let index = 0; index < argv.length; index++) {
    const name = argv[index]
    if (valueNames.includes(name)) {
      if (!argv[index + 1] || argv[index + 1].startsWith('--'))
        throw new Error(`Missing ${name} value`)
      result[name] = argv[++index]
    } else if (flagNames.includes(name)) result[name] = true
    else throw new Error(`Unknown option: ${name}`)
  }
  return result
}

export const sha256 = (value) => createHash('sha256').update(value).digest('hex')
export const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`
export const localHost = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host)

export function configuration(args, action) {
  for (const name of ['SUPABASE_URL', 'SUPABASE_DB_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!process.env[name]) throw new Error(`Set ${name} using a private environment file`)
  }
  const api = new URL(process.env.SUPABASE_URL)
  const database = new URL(process.env.SUPABASE_DB_URL)
  if (!['postgres:', 'postgresql:'].includes(database.protocol))
    throw new Error('Invalid database URL')
  if (api.username || api.password || api.search || api.hash || api.pathname !== '/') {
    throw new Error('SUPABASE_URL must be an API origin without credentials or a path')
  }
  if (!['http:', 'https:'].includes(api.protocol)) throw new Error('Invalid API protocol')
  if (
    (!localHost(api.hostname) || !localHost(database.hostname)) &&
    args['--remote'] !== api.origin
  ) {
    throw new Error(`Remote ${action} requires --remote matching the exact SUPABASE_URL origin`)
  }
  if (!localHost(api.hostname) && api.protocol !== 'https:')
    throw new Error('Remote API requires HTTPS')
  if (action === 'restore' && args['--confirm-target'] !== api.origin) {
    throw new Error('Restore requires --confirm-target matching the exact SUPABASE_URL origin')
  }
  if (!args['--quiesced'])
    throw new Error('Pause source/target writes, then acknowledge with --quiesced')
  const container = process.env.PG_TOOL_CONTAINER
  if (container && !/^[a-zA-Z0-9_.-]+$/.test(container))
    throw new Error('Invalid PG_TOOL_CONTAINER')
  if (process.env.PGROLE && process.env.PGROLE !== 'postgres')
    throw new Error('PGROLE only supports the postgres maintenance role')
  // For a local Supabase DB container, the published host port maps to its internal 5432.
  const insideLocalDatabase = Boolean(container && localHost(database.hostname))
  const pg = {
    PGHOST: insideLocalDatabase ? '127.0.0.1' : database.hostname,
    PGPORT: insideLocalDatabase ? '5432' : database.port || '5432',
    PGUSER: decodeURIComponent(database.username),
    PGPASSWORD: decodeURIComponent(database.password),
    PGDATABASE: decodeURIComponent(database.pathname.slice(1)),
    PGSSLMODE: localHost(database.hostname) ? 'disable' : 'verify-full',
    PGCONNECT_TIMEOUT: '15',
    PGOPTIONS:
      '-c statement_timeout=300000 -c lock_timeout=15000 -c timezone=UTC' +
      (process.env.PGROLE === 'postgres' ? ' -c role=postgres' : ''),
  }
  if (process.env.PGSSLROOTCERT) pg.PGSSLROOTCERT = process.env.PGSSLROOTCERT
  return { api: api.origin, database, pg, container, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
}

export async function pgTool(config, tool, args, { input, output } = {}) {
  const environment = { ...process.env, ...config.pg }
  const command = config.container ? 'docker' : tool
  const commandArgs = config.container
    ? [
        'exec',
        '-i',
        ...Object.keys(config.pg).flatMap((key) => ['-e', key]),
        config.container,
        tool,
        ...args,
      ]
    : args
  const child = spawn(command, commandArgs, { env: environment, stdio: ['pipe', 'pipe', 'pipe'] })
  // Never echo psql/pg_dump stderr: SQL errors may include row data, email addresses or hashes.
  child.stderr.resume()
  let result = ''
  if (!output)
    child.stdout.on('data', (chunk) => {
      result += chunk
    })
  const completed = new Promise((resolve, reject) => {
    child.once('error', () =>
      reject(new Error(`Cannot start ${tool}; install PostgreSQL tools or set PG_TOOL_CONTAINER`)),
    )
    child.once('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`${tool} failed (exit ${code}); details suppressed to protect private data`),
          ),
    )
  })
  const outputFinished = output
    ? pipeline(child.stdout, createWriteStream(output, { flags: 'wx', mode: 0o600 }))
    : Promise.resolve()
  child.stdin.on('error', () => {})
  const inputFinished =
    input && typeof input !== 'string' && !Buffer.isBuffer(input)
      ? pipeline(input, child.stdin)
      : Promise.resolve(child.stdin.end(input))
  await Promise.all([completed, outputFinished, inputFinished])
  return result.trim()
}

export async function query(config, sql) {
  const result = await pgTool(config, 'psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], {
    input: sql,
  })
  return JSON.parse(result)
}

export async function schema(config) {
  return query(
    config,
    `SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.table_schema,c.table_name,c.ordinal_position),'[]'::jsonb)
    FROM (SELECT table_schema,table_name,column_name,ordinal_position,data_type,udt_schema,udt_name,is_nullable,is_generated
      FROM information_schema.columns WHERE table_schema||'.'||table_name IN (${tables.map(sqlString).join(',')})) c;`,
  )
}

export async function fingerprints(config) {
  return query(
    config,
    `SELECT jsonb_object_agg(name,stats) FROM (${tables
      .map(
        (table) =>
          `SELECT ${sqlString(table)} AS name,jsonb_build_object('count',count(*),'digest',md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),''))) AS stats FROM ${table} t`,
      )
      .join(' UNION ALL ')}) s;`,
  )
}

export async function migrations() {
  const directory = path.join(repository, 'supabase/migrations')
  const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()
  if (!names.length) throw new Error('No application migrations found')
  return Promise.all(
    names.map(async (name) => ({
      name,
      sha256: sha256(await readFile(path.join(directory, name))),
    })),
  )
}

export async function mediaObjects(config) {
  return query(
    config,
    `SELECT COALESCE(jsonb_agg(jsonb_build_object('name',name,'metadata',metadata) ORDER BY name),'[]'::jsonb)
    FROM storage.objects WHERE bucket_id='media';`,
  )
}

export async function request(config, route, init = {}) {
  const response = await fetch(`${config.api}${route}`, {
    ...init,
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, ...init.headers },
    signal: AbortSignal.timeout(120000),
    redirect: 'error',
  })
  if (!response.ok)
    throw new Error(`Supabase request failed (${response.status}); private response omitted`)
  return response
}

export async function assertMatchingAccounts(config) {
  const databaseIds = await query(
    config,
    `SELECT COALESCE(jsonb_agg(id::text ORDER BY id::text),'[]'::jsonb) FROM auth.users;`,
  )
  const apiIds = []
  for (let page = 1; ; page++) {
    const result = await (
      await request(config, `/auth/v1/admin/users?page=${page}&per_page=1000`)
    ).json()
    if (!Array.isArray(result.users)) throw new Error('Unexpected Auth API response')
    apiIds.push(...result.users.map((user) => user.id))
    if (result.users.length < 1000) break
  }
  if (JSON.stringify(databaseIds) !== JSON.stringify(apiIds.sort())) {
    throw new Error(
      'Database and API accounts disagree; check project configuration and paused writes',
    )
  }
}

export const objectRoute = (name) =>
  `/storage/v1/object/media/${name.split('/').map(encodeURIComponent).join('/')}`

export async function fileHash(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

async function assertSupportedAuth(config) {
  const unsupported = await query(
    config,
    `SELECT jsonb_build_object(
    'users',(SELECT count(*) FROM auth.users u WHERE email IS NULL OR NULLIF(phone,'') IS NOT NULL
      OR COALESCE((to_jsonb(u)->>'is_anonymous')::boolean,false)
      OR COALESCE((to_jsonb(u)->>'is_sso_user')::boolean,false)),
    'identities',(SELECT count(*) FROM auth.identities WHERE provider<>'email'),
    'mfa',(SELECT count(*) FROM auth.mfa_factors));`,
  )
  if (Object.values(unsupported).some((count) => count !== 0)) {
    throw new Error(
      'Unsupported phone, anonymous, OAuth/SSO or MFA identities; use the official full migration procedure',
    )
  }
  const specialTables = await query(
    config,
    `SELECT COALESCE(jsonb_agg(table_name),'[]'::jsonb) FROM information_schema.tables
    WHERE table_schema='auth' AND (table_name ILIKE '%passkey%' OR table_name ILIKE '%webauthn%' OR table_name='sso_providers');`,
  )
  for (const name of specialTables) {
    if (!/^[a-z_]+$/.test(name)) throw new Error('Unexpected auth table name')
    if (await query(config, `SELECT count(*) FROM auth.${name};`))
      throw new Error('Unsupported additional auth methods; use full migration')
  }
}

export async function ensureOutsideRepository(directory) {
  let current = await realpath(directory)
  for (;;) {
    try {
      await access(path.join(current, '.git'))
      throw new Error('Store sensitive backups outside every Git repository')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    const parent = path.dirname(current)
    if (parent === current) return
    current = parent
  }
}

async function backup() {
  const args = options(process.argv.slice(2), ['--out', '--remote'])
  if (args['--help']) {
    console.log(
      'node --env-file=/private/path/backup.env scripts/production/backup.mjs --out /private/path/new-backup --quiesced [--remote https://PROJECT.supabase.co]\nEnvironment: SUPABASE_URL, SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY; optional PG_TOOL_CONTAINER, PGSSLROOTCERT. Never commit the archive.',
    )
    return
  }
  if (!args['--out']) throw new Error('Provide --out as a new directory outside the repository')
  const config = configuration(args, 'backup')
  process.umask(0o077)
  const output = path.resolve(args['--out'])
  await ensureOutsideRepository(path.dirname(output))
  await assertSupportedAuth(config)
  await assertMatchingAccounts(config)
  const columns = await schema(config)
  for (const table of tables) {
    if (!columns.some((column) => `${column.table_schema}.${column.table_name}` === table))
      throw new Error(`Missing table ${table}; apply migrations first`)
  }
  const bucket = await (await request(config, '/storage/v1/bucket/media')).json()
  if (bucket.public !== false) throw new Error('Expected a private media bucket')
  const before = await fingerprints(config)
  const objects = await mediaObjects(config)
  const migrationFiles = await migrations()
  const runtime = await backupMetadata(config)
  await mkdir(output, { mode: 0o700 }) // No recursive/overwrite: each backup must be new.
  await mkdir(path.join(output, 'objects'), { mode: 0o700 })
  const dataFile = path.join(output, 'database.sql')
  await pgTool(
    config,
    'pg_dump',
    [
      '--data-only',
      '--column-inserts',
      '--rows-per-insert=100',
      '--no-owner',
      '--no-privileges',
      '--no-comments',
      ...tables.flatMap((table) => ['--table', table]),
    ],
    { output: dataFile },
  )
  const media = []
  for (const [index, object] of objects.entries()) {
    const file = `objects/${String(index).padStart(8, '0')}.bin`
    const response = await request(config, objectRoute(object.name))
    await pipeline(
      response.body,
      createWriteStream(path.join(output, file), { flags: 'wx', mode: 0o600 }),
    )
    const stat = await lstat(path.join(output, file))
    media.push({
      name: object.name,
      file,
      size: stat.size,
      sha256: await fileHash(path.join(output, file)),
      contentType:
        object.metadata?.mimetype ||
        response.headers.get('content-type') ||
        'application/octet-stream',
      cacheControl: String(object.metadata?.cacheControl || '3600').replace(/^max-age=/, ''),
    })
  }
  if (
    JSON.stringify(before) !== JSON.stringify(await fingerprints(config)) ||
    JSON.stringify(objects) !== JSON.stringify(await mediaObjects(config))
  ) {
    throw new Error(
      'Source changed during backup; this incomplete directory must not be restored. Pause writes and create a new backup',
    )
  }
  const manifest = {
    format: 'myshkin451-email-password-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    runtime,
    source: { api: config.api, databaseHost: config.database.hostname },
    tables,
    columns,
    rows: before,
    migrations: migrationFiles,
    database: { file: 'database.sql', sha256: await fileHash(dataFile) },
    bucket: {
      id: 'media',
      public: false,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types,
    },
    media,
    excluded: [
      'auth sessions and refresh tokens',
      'provider settings and secrets',
      'platform roles/schema',
      'storage system metadata',
      'other buckets',
    ],
    clearedOnRestore: [
      'auth.users confirmation/recovery/email-change/phone-change/reauthentication token fields',
    ],
  }
  const manifestText = JSON.stringify(manifest, null, 2) + '\n'
  await writeFile(path.join(output, 'manifest.json'), manifestText, { flag: 'wx', mode: 0o600 })
  await writeFile(path.join(output, 'manifest.sha256'), sha256(manifestText) + '\n', {
    flag: 'wx',
    mode: 0o600,
  })
  console.log(
    `Backup complete: ${Object.values(before).reduce((sum, row) => sum + row.count, 0)} rows, ${media.length} media objects. Archive contains private account data; keep encrypted and outside Git.`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  backup().catch((error) => {
    console.error(`Backup failed: ${error.message}`)
    process.exitCode = 1
  })
}
