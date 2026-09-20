import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const cwd = fileURLToPath(new URL('../..', import.meta.url))
const [command, ...args] = process.argv.slice(2)
if (!command) throw new Error('Usage: node scripts/production/local-run.mjs <command> [args]')
// Only local CLI output is read; hosted credentials are never involved or printed.
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
)
if (new URL(status.API_URL).hostname !== '127.0.0.1')
  throw new Error('Refusing a non-local backend')
const child = spawnSync(command, args, {
  cwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    SUPABASE_URL: status.API_URL,
    SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    SUPABASE_DB_URL: status.DB_URL,
    SUPABASE_TEST_DB_CONTAINER: 'supabase_db_myshkin451-production',
    PG_TOOL_CONTAINER: 'supabase_db_myshkin451-production',
  },
})
process.exit(child.status ?? 1)
