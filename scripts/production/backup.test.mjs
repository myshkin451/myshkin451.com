import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { backupMetadata } from './backup.mjs'
import { assertBucketConfiguration } from './restore.mjs'

const expected = { fileSizeLimit: 10485760, allowedMimeTypes: ['image/jpeg', 'image/png'] }
const bucket = {
  public: false,
  file_size_limit: 10485760,
  allowed_mime_types: ['image/png', 'image/jpeg'],
}

test('equivalent MIME restriction sets restore regardless of ordering', () => {
  assert.doesNotThrow(() => assertBucketConfiguration(bucket, expected))
})

test('both tighter and weaker target size constraints reject before restore', () => {
  for (const file_size_limit of [1, 20971520, null]) {
    assert.throws(
      () => assertBucketConfiguration({ ...bucket, file_size_limit }, expected),
      /limits differ/,
    )
  }
})

test('both tighter and weaker target MIME constraints reject before restore', () => {
  for (const allowed_mime_types of [['image/png'], ['image/*'], null, []]) {
    assert.throws(
      () => assertBucketConfiguration({ ...bucket, allowed_mime_types }, expected),
      /limits differ/,
    )
  }
})

test('unrestricted buckets match only unrestricted archives', () => {
  assert.doesNotThrow(() =>
    assertBucketConfiguration(
      { public: false, file_size_limit: null, allowed_mime_types: null },
      { fileSizeLimit: null, allowedMimeTypes: null },
    ),
  )
})

test('public targets and invalid MIME metadata fail closed', () => {
  assert.throws(() => assertBucketConfiguration({ ...bucket, public: true }, expected), /private/)
  assert.throws(
    () => assertBucketConfiguration(bucket, { ...expected, allowedMimeTypes: 'image/png' }),
    /Invalid/,
  )
})

test('version metadata records versions and revision without connection credentials', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'myshkin-backup-tools-'))
  const originalPath = process.env.PATH
  try {
    await writeFile(
      path.join(directory, 'psql'),
      '#!/bin/sh\nif [ "$1" = "--version" ]; then printf "psql (PostgreSQL) 17.6\\n"; else cat >/dev/null; printf \'"17.6"\\n\'; fi\n',
      { mode: 0o700 },
    )
    await writeFile(
      path.join(directory, 'pg_dump'),
      '#!/bin/sh\nprintf "pg_dump (PostgreSQL) 17.6\\n"\n',
      { mode: 0o700 },
    )
    process.env.PATH = `${directory}${path.delimiter}${originalPath}`
    const metadata = await backupMetadata({
      pg: { PGPASSWORD: 'test-only-private-password' },
      key: 'test-only-private-service-key',
    })
    assert.match(metadata.git.commit, /^[a-f0-9]{40,64}$/)
    assert.equal(typeof metadata.git.dirty, 'boolean')
    assert.deepEqual(metadata.tools, {
      node: process.version,
      pgDump: 'pg_dump (PostgreSQL) 17.6',
      psql: 'psql (PostgreSQL) 17.6',
    })
    assert.equal(metadata.postgres, '17.6')
    assert.doesNotMatch(JSON.stringify(metadata), /test-only-private|PGPASSWORD/)
  } finally {
    if (originalPath === undefined) delete process.env.PATH
    else process.env.PATH = originalPath
    await rm(directory, { recursive: true, force: true })
  }
})
