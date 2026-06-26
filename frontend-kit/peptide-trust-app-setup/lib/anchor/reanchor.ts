/**
 * Re-anchor existing score snapshots and penalty flags so their anchor_hash
 * values are deterministic and verifiable via /api/anchors/verify.
 *
 * Idempotent — deterministic hashing means re-runs are no-ops. Pure w.r.t. the
 * passed `sql` client so it can be shared by both the CLI script
 * (scripts/anchor-events.ts) and the cron route (app/api/cron/anchor).
 */
import type postgres from 'postgres'
import { createHash } from 'node:crypto'
import { algoLabel } from '../algo-versions'

type Sql = ReturnType<typeof postgres>

export interface ReanchorResult {
  scoreCount: number
  flagCount: number
}

function hashOf(payload: string): string {
  return '0x' + createHash('sha256').update(payload).digest('hex')
}

export async function reanchorAll(sql: Sql): Promise<ReanchorResult> {
  let scoreCount = 0
  let flagCount = 0

  const events = await sql<
    {
      id: string
      slug: string
      score: string
      algo_version: number
      inputs_hash: string
      computed_at: Date
    }[]
  >`
    SELECT se.id, p.slug, se.score, se.algo_version, se.inputs_hash, se.computed_at
      FROM score_events se JOIN participants p ON p.id = se.participant_id
  `
  for (const e of events) {
    const payload = [
      'score',
      e.slug,
      Number(e.score),
      algoLabel(e.algo_version),
      e.inputs_hash,
      new Date(e.computed_at).toISOString(),
    ].join('|')
    await sql`
      UPDATE score_events
         SET anchor_hash = ${hashOf(payload)}, anchor_status = 'anchored'
       WHERE id = ${e.id}
    `
    scoreCount++
  }

  const flags = await sql<
    { id: string; slug: string; type: string; opened_at: Date }[]
  >`
    SELECT pf.id, p.slug, pf.type, pf.opened_at
      FROM penalty_flags pf JOIN participants p ON p.id = pf.participant_id
  `
  for (const f of flags) {
    const payload = ['flag', f.slug, f.type, new Date(f.opened_at).toISOString()].join('|')
    await sql`UPDATE penalty_flags SET anchor_hash = ${hashOf(payload)} WHERE id = ${f.id}`
    flagCount++
  }

  return { scoreCount, flagCount }
}
