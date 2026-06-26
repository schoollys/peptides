import 'server-only'
import { createHash } from 'node:crypto'
import {
  computeTrustScore,
  BALANCED,
  type ComputeInput,
  type DecayClass,
  type FactorCode,
  type PenaltyFlag,
  type RoleCode,
} from '@peptidetrust/core-scoring'
import { getSql } from '@/lib/db'
import { getAnchorProvider, scoreAnchorPayload } from '@/lib/anchor/provider'

const ALGO_LABEL: Record<number, string> = { 1: 'v2.3.2', 2: 'v2.4.0', 3: 'v2.4.1' }

interface RecomputeResult {
  score: number
  dominant: FactorCode | null
  isBalanced: boolean
  anchorHash: string
  scoreEventId: string
}

/**
 * Recompute a participant's Trust Score from current factor_inputs + penalty_flags
 * using the canonical core-scoring engine, then persist + anchor a new score_event.
 * Returns null when the participant has no role/factors to score.
 */
export async function recomputeParticipantScore(participantId: string): Promise<RecomputeResult | null> {
  const sql = getSql()

  const partRows = await sql<{ slug: string; role_code: string; current_algo_version: number }[]>`
    SELECT slug, role_code, current_algo_version FROM participants WHERE id = ${participantId} LIMIT 1
  `
  const part = partRows[0]
  if (!part) return null

  const factorRows = await sql<
    { factor: string; value: string; di_class: string; vi: string; observed_at: Date }[]
  >`
    SELECT factor, value, di_class, vi, observed_at
      FROM factor_inputs WHERE participant_id = ${participantId}
      ORDER BY observed_at ASC
  `
  if (factorRows.length === 0) return null

  const flagRows = await sql<
    { type: string; pk: string; status: string; severity: string; expires_at: Date | null }[]
  >`
    SELECT type, pk, status, severity, expires_at
      FROM penalty_flags WHERE participant_id = ${participantId}
  `

  const factors: ComputeInput['factors'] = factorRows.map((f) => ({
    code: f.factor as FactorCode,
    Fi: Number(f.value),
    Vi: Number(f.vi),
    observedAt: new Date(f.observed_at),
    decayClass: f.di_class as DecayClass,
  }))

  const flags: PenaltyFlag[] = flagRows.map((fl) => ({
    type: fl.type,
    pk: Number(fl.pk),
    status: fl.status as PenaltyFlag['status'],
    severity: fl.severity as PenaltyFlag['severity'],
    ...(fl.expires_at ? { expiresAt: new Date(fl.expires_at) } : {}),
  }))

  const now = new Date()
  const result = computeTrustScore({ role: part.role_code as RoleCode, factors, flags, now })

  const isBalanced = result.dominant === BALANCED
  const dominant: FactorCode | null =
    result.dominant && result.dominant !== BALANCED ? (result.dominant as FactorCode) : null

  const inputsHash =
    'sha256:' +
    createHash('sha256')
      .update(
        JSON.stringify(
          factorRows.map((f) => [f.factor, Number(f.value), Number(f.vi), f.di_class]),
        ),
      )
      .digest('hex')

  const computedAt = now.toISOString()
  const anchor = await getAnchorProvider().anchor(
    scoreAnchorPayload({
      participantSlug: part.slug,
      score: result.score,
      algoVersion: ALGO_LABEL[part.current_algo_version] ?? String(part.current_algo_version),
      inputsHash,
      computedAt,
    }),
  )

  const [row] = await sql<{ id: string }[]>`
    INSERT INTO score_events
      (participant_id, score, dominant_factor, is_balanced, algo_version,
       inputs_hash, anchor_hash, anchor_status, computed_at)
    VALUES
      (${participantId}, ${result.score}, ${dominant}, ${isBalanced},
       ${part.current_algo_version}, ${inputsHash}, ${anchor.anchorHash}, 'anchored', ${computedAt})
    RETURNING id
  `

  return {
    score: result.score,
    dominant,
    isBalanced,
    anchorHash: anchor.anchorHash,
    scoreEventId: row!.id,
  }
}
