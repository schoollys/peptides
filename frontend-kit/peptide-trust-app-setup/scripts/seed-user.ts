/**
 * Seed a demo account so login works out of the box in development.
 *
 *   email:    demo@peptidetrust.eu
 *   password: demo12345
 *
 * Linked to participant slug p-001. Idempotent (upsert by email).
 * Run AFTER db:seed, because TRUNCATE ... CASCADE in seed.ts also clears users.
 *
 * Run: npm run db:seed:user
 */
import postgres from 'postgres'
import { randomBytes, scryptSync } from 'node:crypto'
import { assertDemoSeedAllowed } from '../lib/demo-seed-guard'

assertDemoSeedAllowed('db:seed:user')

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

const EMAIL = 'demo@peptidetrust.eu'
const PASSWORD = 'demo12345'
const DISPLAY = 'Demo Operator'

async function main() {
  const [p] = await sql<{ id: string }[]>`SELECT id FROM participants WHERE slug = 'p-001' LIMIT 1`
  const participantId = p?.id ?? null

  await sql`
    INSERT INTO users (email, password_hash, display_name, participant_id)
    VALUES (${EMAIL}, ${hashPassword(PASSWORD)}, ${DISPLAY}, ${participantId})
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          display_name  = EXCLUDED.display_name,
          participant_id = EXCLUDED.participant_id
  `
  console.log(`Demo user ready: ${EMAIL} / ${PASSWORD} (participant: ${participantId ?? 'none'})`)
  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
