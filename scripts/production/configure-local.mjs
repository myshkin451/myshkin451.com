import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
)
if (new URL(status.API_URL).hostname !== '127.0.0.1') throw new Error('Refusing non-local backend')
writeFileSync(
  'site/.env.local',
  `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}\nSITE_URL=http://127.0.0.1:4325\nNEXT_PUBLIC_EMAIL_AUTH_ENABLED=true\n`,
  { mode: 0o600, flag: 'wx' },
)
console.log('Local site configured. Existing environment files are never overwritten.')
