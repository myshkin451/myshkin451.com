import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseDatabaseCredentials, parseServiceRole } from './linked-backup.mjs'

const ref = 'abcdefghijklmnopqrst'
const exports = `export PGHOST="db.${ref}.supabase.co"
export PGPORT="5432"
export PGUSER="cli_login_postgres"
export PGPASSWORD="fixture:password/@"
export PGDATABASE="postgres"`
const jwt = (payload) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`

test('extracts only literal database credentials and safely URL-encodes password', () => {
  const url = new URL(
    parseDatabaseCredentials(`# generated shell\n${exports}\npg_dump --schema-only`, ref),
  )
  assert.equal(url.hostname, `db.${ref}.supabase.co`)
  assert.equal(decodeURIComponent(url.password), 'fixture:password/@')
  assert.equal(url.username, 'cli_login_postgres')
})

test('rejects missing, duplicate and unsupported exports', () => {
  for (const source of [
    exports.replace('export PGPORT="5432"', ''),
    `${exports}\nexport PGPORT="5432"`,
    `${exports}\nexport PGOPTIONS="anything"`,
    exports.replace('export PGPORT=', ' export PGPORT='),
  ])
    assert.throws(() => parseDatabaseCredentials(source, ref), /Unexpected/)
})

test('rejects shell interpolation, escape sequences and nonliteral values', () => {
  for (const value of [
    '$TOKEN',
    '$(touch /tmp/should-not-run)',
    '`whoami`',
    'escape\\x',
    '"; whoami; "',
  ]) {
    assert.throws(
      () => parseDatabaseCredentials(exports.replace('fixture:password/@', value), ref),
      /Unexpected/,
    )
  }
})

test('rejects cross-project hosts, wrong port/database and invalid ref', () => {
  for (const source of [
    exports.replace(`db.${ref}.supabase.co`, 'evil.example'),
    exports.replace('5432', '6543'),
    exports.replace('PGDATABASE="postgres"', 'PGDATABASE="other"'),
  ])
    assert.throws(() => parseDatabaseCredentials(source, ref), /Unexpected/)
  assert.throws(() => parseDatabaseCredentials(exports, `${ref};echo`), /Unexpected/)
})

test('requires exactly one complete matching service-role JWT', () => {
  const key = jwt({ ref, role: 'service_role' })
  const source = JSON.stringify([
    { name: 'anon', api_key: 'ignored' },
    { name: 'service_role', api_key: key },
  ])
  assert.equal(parseServiceRole(source, ref), key)
  for (const records of [
    [],
    [{ name: 'service_role', api_key: 'masked...' }],
    [{ name: 'service_role', api_key: jwt({ ref, role: 'anon' }) }],
    [{ name: 'service_role', api_key: jwt({ ref: 'other', role: 'service_role' }) }],
    [
      { name: 'service_role', api_key: key },
      { name: 'service_role', api_key: key },
    ],
    { name: 'service_role', api_key: key },
  ])
    assert.throws(() => parseServiceRole(JSON.stringify(records), ref), /Unexpected/)
  assert.throws(() => parseServiceRole('not JSON', ref), /Unexpected/)
})
