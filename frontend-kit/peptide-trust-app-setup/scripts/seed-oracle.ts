/**
 * Seed a development oracle (accredited lab) with an Ed25519 key pair.
 *
 * The public key is stored in sources.pubkey; the private key is written to
 * .oracle-dev-key.pem (gitignored) so the demo signer can produce valid COA
 * signatures the API will accept. Idempotent: re-runs rotate the dev key.
 *
 * Run: npm run db:seed:oracle
 */
import postgres from 'postgres'
import { generateKeyPairSync } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { assertDemoSeedAllowed } from '../lib/demo-seed-guard'

assertDemoSeedAllowed('db:seed:oracle')

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

const DEV_TAG = 'DEV-ORACLE ISO/IEC 17025'

async function main() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  const existing = await sql<{ id: string }[]>`
    SELECT id FROM sources WHERE accreditation = ${DEV_TAG} LIMIT 1
  `

  let id: string
  if (existing[0]) {
    id = existing[0].id
    await sql`UPDATE sources SET pubkey = ${publicKey as string}, status = 'active' WHERE id = ${id}`
  } else {
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO sources (type, independence_flag, accreditation, pubkey, status)
      VALUES ('lab', true, ${DEV_TAG}, ${publicKey as string}, 'active')
      RETURNING id
    `
    id = row!.id
  }

  const keyPath = resolve(process.cwd(), '.oracle-dev-key.pem')
  writeFileSync(keyPath, privateKey as string, { mode: 0o600 })

  console.log(`Oracle ready: source id=${id}`)
  console.log(`Private key written to ${keyPath} (gitignored)`)
  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
