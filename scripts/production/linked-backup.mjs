#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { options, repository } from './backup.mjs'

const execute = promisify(execFile)
const invalid = () => new Error('Unexpected linked credential format or project binding')
let stage = 'arguments'

export function assertProjectRef(value) {
  if (typeof value !== 'string' || !/^[a-z]{20}$/.test(value)) throw invalid()
  return value
}

export function parseDatabaseCredentials(source, projectRef) {
  assertProjectRef(projectRef)
  const fields = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE']
  const values = {}
  for (const line of source.split(/\r?\n/)) {
    if (!/^\s*export\s+PG/.test(line)) continue
    const match = /^export (PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)="([^"\\$`\r\n]*)"$/.exec(
      line,
    )
    if (!match || Object.hasOwn(values, match[1]) || !match[2] || /[^\x20-\x7e]/.test(match[2]))
      throw invalid()
    values[match[1]] = match[2]
  }
  if (
    fields.some((name) => !Object.hasOwn(values, name)) ||
    values.PGHOST !== `db.${projectRef}.supabase.co` ||
    values.PGPORT !== '5432' ||
    values.PGDATABASE !== 'postgres' ||
    !/^[a-zA-Z0-9_.-]+$/.test(values.PGUSER)
  )
    throw invalid()
  const url = new URL(`postgresql://${values.PGHOST}:5432/postgres`)
  url.username = values.PGUSER
  url.password = values.PGPASSWORD
  return url.href
}

export function parseServiceRole(source, projectRef) {
  assertProjectRef(projectRef)
  let records
  try {
    records = JSON.parse(source)
  } catch {
    throw invalid()
  }
  if (!Array.isArray(records)) throw invalid()
  const matches = records.filter((item) => item?.name === 'service_role')
  if (matches.length !== 1 || typeof matches[0].api_key !== 'string') throw invalid()
  const key = matches[0].api_key
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) throw invalid()
  let payload
  try {
    payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
  } catch {
    throw invalid()
  }
  // Binding check only: trust is supplied by the authenticated CLI, not this JWT decode.
  if (payload.ref !== projectRef || payload.role !== 'service_role') throw invalid()
  return key
}

async function capture(command, args, env = process.env) {
  try {
    const result = await execute(command, args, {
      cwd: repository,
      env,
      encoding: 'utf8',
      timeout: 600000,
      maxBuffer: 4 * 1024 * 1024,
    })
    return result.stdout
  } catch {
    // execFile errors contain stdout/stderr and argv; never expose them.
    throw new Error('Linked backup subprocess failed; private details suppressed')
  }
}

async function main() {
  const args = options(process.argv.slice(2), ['--project-ref', '--out', '--pg-container'])
  if (args['--help']) {
    console.log(
      'node scripts/production/linked-backup.mjs --project-ref PROJECT_REF --out PRIVATE_NEW_DIRECTORY --pg-container RUNNING_PG_CONTAINER --quiesced',
    )
    return
  }
  const ref = assertProjectRef(args['--project-ref'])
  if (!args['--out'] || !args['--quiesced'])
    throw new Error('Require --out and explicit --quiesced')
  const linked = (
    await readFile(path.join(repository, 'supabase/.temp/project-ref'), 'utf8')
  ).trim()
  if (linked !== ref) throw invalid()
  stage = 'postgres-container'
  const container = args['--pg-container'] || process.env.PG_TOOL_CONTAINER
  if (!container || !/^[a-zA-Z0-9_.-]+$/.test(container))
    throw new Error('Provide a running --pg-container or PG_TOOL_CONTAINER')
  if (
    (await capture('docker', ['inspect', '--format', '{{.State.Running}}', container])).trim() !==
    'true'
  )
    throw new Error('PostgreSQL tool container must already be running')
  stage = 'linked-database-credentials'
  const database = parseDatabaseCredentials(
    await capture('pnpm', ['exec', 'supabase', 'db', 'dump', '--linked', '--dry-run']),
    ref,
  )
  stage = 'project-service-role'
  const key = parseServiceRole(
    await capture('pnpm', [
      'exec',
      'supabase',
      'projects',
      'api-keys',
      '--project-ref',
      ref,
      '--output',
      'json',
    ]),
    ref,
  )
  const api = `https://${ref}.supabase.co`
  stage = 'archive-export'
  await capture(
    process.execPath,
    [
      path.join(repository, 'scripts/production/backup.mjs'),
      '--out',
      args['--out'],
      '--remote',
      api,
      '--quiesced',
    ],
    {
      ...process.env,
      SUPABASE_URL: api,
      SUPABASE_DB_URL: database,
      SUPABASE_SERVICE_ROLE_KEY: key,
      PG_TOOL_CONTAINER: container,
      PGROLE: 'postgres',
    },
  )
  console.log(
    'Linked backup completed. Credentials were kept in process memory; verify the private archive before relying on it.',
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    console.error(
      `Linked backup failed at ${stage}. Private CLI output was suppressed. No credential file was written.`,
    )
    process.exitCode = 1
  })
}
