/**
 * Read-only audit: compare each participant's seeded latest score against what
 * the canonical core-scoring engine computes from current factor_inputs +
 * penalty_flags. Helps decide whether a full recompute is safe before mutating.
 *
 * Run: npx tsx scripts/score-audit.ts
 */
import postgres from 'postgres'
import {
  computeTrustScore,
  BALANCED,
  type ComputeInput,
  type DecayClass,
  type FactorCode,
  type PenaltyFlag,
  type RoleCode,
} from '@peptidetrust/core-scoring'

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

async function main() {
  const parts = await sql<
    { id: string; slug: string; display_name: string; role_code: string }[]
  >`SELECT id, slug, display_name, role_code FROM participants ORDER BY created_at ASC`

  const now = new Date()
  console.log(
    ['slug', 'role', 'seedScore', 'engineScore', 'tier', 'delta', 'fActive', 'dominant'].join('\t'),
  )

  for (const p of parts) {
    const factorRows = await sql<
      { factor: string; value: string; di_class: string; vi: string; observed_at: Date }[]
    >`SELECT factor, value, di_class, vi, observed_at FROM factor_inputs WHERE participant_id = ${p.id}`

    const flagRows = await sql<
      { type: string; pk: string; status: string; severity: string; expires_at: Date | null }[]
    >`SELECT type, pk, status, severity, expires_at FROM penalty_flags WHERE participant_id = ${p.id}`

    const [seed] = await sql<{ score: string }[]>`
      SELECT score FROM score_events WHERE participant_id = ${p.id}
      ORDER BY computed_at DESC LIMIT 1`

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

    if (factors.length === 0) {
      console.log([p.slug, p.role_code, seed?.score ?? '—', 'n/a', '—', '', 0, ''].join('\t'))
      continue
    }

    const r = computeTrustScore({ role: p.role_code as RoleCode, factors, flags, now })
    const seedScore = seed ? Number(seed.score) : NaN
    const delta = Number.isNaN(seedScore) ? '' : (r.score - seedScore).toFixed(1)
    const dom = r.dominant === BALANCED ? 'BALANCED' : (r.dominant ?? '—')
    console.log(
      [p.slug, p.role_code, seed?.score ?? '—', r.score, r.tier, delta, factors.length, dom].join('\t'),
    )
  }

  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
