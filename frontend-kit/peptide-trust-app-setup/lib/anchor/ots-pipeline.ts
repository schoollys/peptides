/**
 * OpenTimestamps anchoring pipeline (batch, out-of-band).
 *
 * Runs from the daily cron when ANCHOR_PROVIDER=ots. Two phases, both keyed
 * purely off `anchor_hash` (a SHA-256 digest) so no payloads are needed:
 *
 *   STAMP   — for every anchor hash present in score_events/coas/penalty_flags
 *             that has no proof yet, submit it to the public calendars and store
 *             the pending .ots proof.
 *   UPGRADE — for every pending proof, try to fetch the Bitcoin attestation;
 *             when it confirms, mark 'anchored' and record the block.
 *
 * Pure w.r.t. the passed `sql` client so it can be shared by the cron route and
 * a CLI script. Per-item failures are caught so one bad hash can't abort a run.
 */
import type postgres from 'postgres'
import { stampAnchorHash, upgradeProof, verifyProof } from './ots'

type Sql = ReturnType<typeof postgres>

export interface OtsPipelineResult {
  stamped: number
  upgraded: number
  stillPending: number
  failed: number
}

export interface OtsPipelineOptions {
  /** Max new hashes to stamp per run (each is a network round-trip). */
  stampLimit?: number
  /** Max pending proofs to attempt upgrading per run. */
  upgradeLimit?: number
}

function toBuffer(proof: unknown): Buffer {
  return Buffer.isBuffer(proof) ? proof : Buffer.from(proof as Uint8Array)
}

export async function runOtsPipeline(
  sql: Sql,
  opts: OtsPipelineOptions = {},
): Promise<OtsPipelineResult> {
  const stampLimit = opts.stampLimit ?? 25
  const upgradeLimit = opts.upgradeLimit ?? 50
  let stamped = 0
  let upgraded = 0
  let failed = 0

  // ── Phase 1: stamp not-yet-anchored hashes ────────────────────────────────
  const toStamp = await sql<{ anchor_hash: string }[]>`
    SELECT DISTINCT h.anchor_hash FROM (
      SELECT anchor_hash FROM score_events  WHERE anchor_hash IS NOT NULL
      UNION
      SELECT anchor_hash FROM coas          WHERE anchor_hash IS NOT NULL
      UNION
      SELECT anchor_hash FROM penalty_flags WHERE anchor_hash IS NOT NULL
    ) h
    WHERE NOT EXISTS (
      SELECT 1 FROM anchor_proofs ap WHERE ap.anchor_hash = h.anchor_hash
    )
    LIMIT ${stampLimit}
  `
  for (const { anchor_hash } of toStamp) {
    try {
      const proof = await stampAnchorHash(anchor_hash)
      await sql`
        INSERT INTO anchor_proofs (anchor_hash, chain, proof, status)
        VALUES (${anchor_hash}, 'bitcoin-ots', ${proof}, 'pending')
        ON CONFLICT (anchor_hash) DO NOTHING
      `
      stamped++
    } catch (err) {
      console.error('[ots] stamp failed for', anchor_hash, err)
      failed++
    }
  }

  // ── Phase 2: upgrade pending proofs ───────────────────────────────────────
  const pending = await sql<{ anchor_hash: string; proof: Uint8Array }[]>`
    SELECT anchor_hash, proof FROM anchor_proofs
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT ${upgradeLimit}
  `
  for (const row of pending) {
    try {
      const { proof } = await upgradeProof(toBuffer(row.proof))
      const verdict = await verifyProof(proof, row.anchor_hash)
      const confirmed = !verdict.pending && verdict.bitcoin !== null

      await sql`
        UPDATE anchor_proofs
           SET proof          = ${proof},
               attempts       = attempts + 1,
               status         = ${confirmed ? 'anchored' : 'pending'},
               bitcoin_height = ${verdict.bitcoin?.height ?? null},
               bitcoin_time   = ${verdict.bitcoin?.time ?? null},
               upgraded_at    = ${confirmed ? sql`now()` : null}
         WHERE anchor_hash = ${row.anchor_hash}
      `

      if (confirmed) {
        upgraded++
        await sql`
          UPDATE score_events SET anchor_status = 'anchored'
           WHERE anchor_hash = ${row.anchor_hash} AND anchor_status <> 'anchored'
        `
      }
    } catch (err) {
      console.error('[ots] upgrade failed for', row.anchor_hash, err)
      failed++
    }
  }

  const [{ count }] = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count FROM anchor_proofs WHERE status = 'pending'
  `

  return { stamped, upgraded, stillPending: Number(count), failed }
}
