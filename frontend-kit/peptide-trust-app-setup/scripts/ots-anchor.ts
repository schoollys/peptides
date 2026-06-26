/**
 * Run the OpenTimestamps anchoring pipeline against the database once: stamp any
 * not-yet-anchored hashes and try to upgrade pending proofs to a confirmed
 * Bitcoin attestation. This is the same routine the daily cron runs — handy for
 * stamping immediately or polling for confirmation without waiting for the cron.
 *
 * Run: npm run anchor:ots
 */
import postgres from 'postgres'
import { runOtsPipeline } from '../lib/anchor/ots-pipeline'

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

async function main() {
  const result = await runOtsPipeline(sql)
  console.log('OTS pipeline:', JSON.stringify(result, null, 2))
  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
