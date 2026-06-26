/**
 * Re-anchor existing score snapshots and penalty flags through deterministic
 * hashing so their anchor_hash values are real and verifiable via
 * /api/anchors/verify. Idempotent — deterministic hashing means re-runs are no-ops.
 *
 * Shares the core with the cron route via lib/anchor/reanchor.ts.
 *
 * Run: npm run anchor
 */
import postgres from 'postgres'
import { reanchorAll } from '../lib/anchor/reanchor'

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

async function main() {
  const { scoreCount, flagCount } = await reanchorAll(sql)
  console.log(`Anchored ${scoreCount} score events, ${flagCount} flags`)
  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
