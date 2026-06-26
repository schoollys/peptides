/**
 * Publish the env-key public key into the DB so the oracle's COA signatures
 * verify. Derives the public key from PKI_PRIVATE_KEY and writes it to the
 * active lab oracle's sources.pubkey (the same source submitCoa resolves).
 *
 * This is a production-safe operation (no PII, no demo data), so it is NOT
 * gated by the demo-seed guard — but it does require PKI_PRIVATE_KEY.
 *
 * Run: PKI_PRIVATE_KEY=... DATABASE_URL=... npm run pki:sync-oracle
 */
import postgres from 'postgres'
import { EnvKeyPkiProvider } from '../lib/pki/ed25519'

const pubkey = new EnvKeyPkiProvider().getPublicKeyPem()

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

async function main() {
  // Match the oracle submitCoa would pick: the oldest active lab with a key.
  const rows = await sql<{ id: string }[]>`
    SELECT id FROM sources
     WHERE type = 'lab' AND status = 'active'
     ORDER BY created_at ASC
     LIMIT 1
  `
  const oracle = rows[0]
  if (!oracle) {
    console.error('No active lab oracle found. Seed one first (npm run db:seed:oracle).')
    await sql.end()
    process.exit(1)
  }

  await sql`UPDATE sources SET pubkey = ${pubkey} WHERE id = ${oracle.id}`
  console.log(`Oracle ${oracle.id} pubkey updated to match PKI_PRIVATE_KEY.`)
  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
