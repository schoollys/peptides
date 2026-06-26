/**
 * Recompute EVERY participant's Trust Score with the canonical core-scoring
 * engine and write a fresh anchored score_event for each.
 *
 * ⚠️ DESTRUCTIVE to displayed scores. The provisional weight matrix + decay do
 * NOT yet match seeded factor coverage (see `npx tsx scripts/score-audit.ts`),
 * so a blanket run will materially change tiers across the catalog. Run this
 * only AFTER SME parameter calibration (params.ts → v1.0).
 *
 * Guard: requires `--yes` (or CONFIRM=1) to actually mutate.
 *
 * Run: npm run recompute:all -- --yes
 */
import postgres from 'postgres'
import { createHash } from 'node:crypto'
import {
  computeTrustScore,
  propagatedVi,
  BALANCED,
  type ComputeInput,
  type DecayClass,
  type FactorCode,
  type KybLevel,
  type PenaltyFlag,
  type PropagationEdge,
  type RoleCode,
} from '@peptidetrust/core-scoring'
import { ALGO_LABEL } from '../lib/algo-versions'

const confirmed = process.argv.includes('--yes') || process.env.CONFIRM === '1'

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

function anchorHashOf(payload: string): string {
  return '0x' + createHash('sha256').update(payload).digest('hex')
}

async function main() {
  const parts = await sql<
    {
      id: string
      slug: string
      role_code: string
      current_algo_version: number
      is_verified_legal: boolean
      kyb_level: string | null
    }[]
  >`SELECT id, slug, role_code, current_algo_version, is_verified_legal, kyb_level
      FROM participants ORDER BY created_at ASC`

  // ── V1: counterparty graph (Vᵢ-propagation) ────────────────────────────────
  // Edge direction in the schema is downstream → upstream (from buyer-facing node
  // to its source). For each participant we collect outgoing links to read the
  // source's per-factor subscores.
  const linkRows = await sql<
    { from_id: string; to_id: string; lot_share: string; blind_flag: boolean }[]
  >`SELECT from_id, to_id, lot_share, blind_flag FROM counterparty_links`
  const upstreamLinks = new Map<string, { to_id: string; lotShare: number; isBlind: boolean }[]>()
  for (const l of linkRows) {
    const list = upstreamLinks.get(l.from_id) ?? []
    list.push({ to_id: l.to_id, lotShare: Number(l.lot_share), isBlind: l.blind_flag })
    upstreamLinks.set(l.from_id, list)
  }

  // Per-participant factor subscores (Fi), used as the propagated signal.
  const allFactorRows = await sql<
    { participant_id: string; factor: string; value: string }[]
  >`SELECT participant_id, factor, value FROM factor_inputs`
  const subscoreByPid = new Map<string, Map<string, number>>()
  for (const f of allFactorRows) {
    const m = subscoreByPid.get(f.participant_id) ?? new Map<string, number>()
    m.set(f.factor, Number(f.value))
    subscoreByPid.set(f.participant_id, m)
  }

  const verifiedById = new Map(parts.map((p) => [p.id, p.is_verified_legal]))

  const now = new Date()
  let written = 0
  let skipped = 0

  for (const p of parts) {
    const factorRows = await sql<
      { factor: string; value: string; di_class: string; vi: string; observed_at: Date }[]
    >`SELECT factor, value, di_class, vi, observed_at FROM factor_inputs WHERE participant_id = ${p.id}`
    if (factorRows.length === 0) { skipped++; continue }

    const flagRows = await sql<
      { type: string; pk: string; status: string; severity: string; expires_at: Date | null }[]
    >`SELECT type, pk, status, severity, expires_at FROM penalty_flags WHERE participant_id = ${p.id}`

    // V1 Vᵢ-propagation: for each factor, blend the node's own Vᵢ with the verified
    // upstream source's subscore. Applied only where an upstream edge carries that
    // factor; propagation can only raise Vᵢ (no-harm: max with the base), so a
    // directly-verified node above the cap is never penalised.
    const links = upstreamLinks.get(p.id) ?? []
    const propagateVi = (factor: string, baseVi: number): number => {
      if (links.length === 0) return baseVi
      const edges: PropagationEdge[] = []
      for (const l of links) {
        const sub = subscoreByPid.get(l.to_id)?.get(factor)
        if (sub === undefined) continue
        edges.push({ subscore: sub, lotShare: l.lotShare, isBlind: l.isBlind })
      }
      if (edges.length === 0) return baseVi
      return Math.max(baseVi, propagatedVi(baseVi, edges))
    }

    const factors: ComputeInput['factors'] = factorRows.map((f) => ({
      code: f.factor as FactorCode,
      Fi: Number(f.value),
      Vi: propagateVi(f.factor, Number(f.vi)),
      observedAt: new Date(f.observed_at),
      decayClass: f.di_class as DecayClass,
    }))

    // A reseller's tier ceiling is lifted when at least one upstream source is a
    // legally-verified producer.
    const upstreamVerified = links.some((l) => verifiedById.get(l.to_id) === true)
    const flags: PenaltyFlag[] = flagRows.map((fl) => ({
      type: fl.type,
      pk: Number(fl.pk),
      status: fl.status as PenaltyFlag['status'],
      severity: fl.severity as PenaltyFlag['severity'],
      ...(fl.expires_at ? { expiresAt: new Date(fl.expires_at) } : {}),
    }))

    const r = computeTrustScore({
      role: p.role_code as RoleCode,
      factors,
      flags,
      now,
      upstreamVerified,
      ...(p.kyb_level ? { kybLevel: p.kyb_level as KybLevel } : {}),
    })
    const isBalanced = r.dominant === BALANCED
    const dominant = r.dominant && r.dominant !== BALANCED ? (r.dominant as FactorCode) : null
    const inputsHash =
      'sha256:' +
      createHash('sha256')
        .update(JSON.stringify(factorRows.map((f) => [f.factor, Number(f.value), Number(f.vi), f.di_class])))
        .digest('hex')
    const computedAt = now.toISOString()
    const payload = [
      'score', p.slug, r.score,
      ALGO_LABEL[p.current_algo_version] ?? String(p.current_algo_version),
      inputsHash, computedAt,
    ].join('|')

    if (confirmed) {
      await sql`
        INSERT INTO score_events
          (participant_id, score, dominant_factor, is_balanced, algo_version,
           inputs_hash, anchor_hash, anchor_status, computed_at)
        VALUES
          (${p.id}, ${r.score}, ${dominant}, ${isBalanced}, ${p.current_algo_version},
           ${inputsHash}, ${anchorHashOf(payload)}, 'anchored', ${computedAt})
      `
    }
    written++
    console.log(`${p.slug}\t${r.score}\t${dominant ?? (isBalanced ? 'BALANCED' : '—')}`)
  }

  console.log(
    confirmed
      ? `Recomputed + wrote ${written} score events (${skipped} skipped, no factors).`
      : `DRY RUN — would write ${written} score events (${skipped} skipped). Re-run with --yes to apply.`,
  )
  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
