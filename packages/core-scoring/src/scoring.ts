/**
 * Trust Score engine — pure, deterministic, framework-independent.
 *
 * Master formula (spec-algorithm.html §02):
 *   TS = ( Σᵢ Fᵢ · Wᵢ · Dᵢ · Vᵢ ) · ( 1 − Pₛ )
 *
 * Each helper maps 1:1 to a section of the spec and is independently testable.
 */

import {
  BALANCED_THRESHOLD,
  CONC_PENALTY,
  CONC_THRESHOLD,
  DECAY_FLOOR,
  FACTOR_DECAY_CLASS,
  HALF_LIFE_DAYS,
  KYB_VI_FLOOR,
  LAMBDA_BLIND,
  ROLE_FACTOR_WEIGHTS,
  ROLE_TIER_CEILING,
  TIER_CAP_ON_CRITICAL,
  TIER_THRESHOLDS,
  VI_BASE,
  VI_CAP,
  VI_SLOPE,
} from './params.js'
import {
  BALANCED,
  type ComputeInput,
  type ComputeResult,
  type DecayClass,
  type Dominant,
  type FactorContribution,
  type PenaltyFlag,
  type RoleCode,
  type Tier,
} from './types.js'

const MS_PER_DAY = 86_400_000

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

// ─── §04 — Dᵢ: freshness decay ────────────────────────────────────────────────
export function decay(dtDays: number, cls: DecayClass): number {
  const halfLife = HALF_LIFE_DAYS[cls]
  const d = Math.pow(2, -dtDays / halfLife)
  return Math.max(DECAY_FLOOR[cls], d)
}

export function decayFromDate(observedAt: Date, cls: DecayClass, now: Date): number {
  const dtDays = (now.getTime() - observedAt.getTime()) / MS_PER_DAY
  return decay(Math.max(0, dtDays), cls)
}

// ─── §05 — Vᵢ: base verification multiplier ───────────────────────────────────
export function baseVi(sourceSubscore: number, isBlind: boolean): number {
  let vi = VI_BASE + (sourceSubscore / 100) * VI_SLOPE
  if (isBlind) vi *= LAMBDA_BLIND
  return clamp(vi, 0, 1)
}

// ─── §06 — Vᵢ: one-hop weighted propagation ───────────────────────────────────
export interface PropagationEdge {
  /** counterparty subscore for this factor, 0..100 */
  subscore: number
  /** lot_share weight */
  lotShare: number
  isBlind?: boolean
}

/**
 * Bounded one-hop propagation. Cycles must be excluded by the caller (graph layer).
 * `base` is the node's own baseVi (used when there are no neighbors).
 */
export function propagatedVi(base: number, edges: PropagationEdge[]): number {
  if (edges.length === 0) return clamp(base, 0, VI_CAP)

  let num = 0
  let den = 0
  const shares: number[] = []
  for (const e of edges) {
    const s = e.lotShare * (e.isBlind ? LAMBDA_BLIND : 1)
    num += s * e.subscore
    den += s
    shares.push(s)
  }
  if (den === 0) return clamp(base, 0, VI_CAP)

  const sProp = num / den / 100 // back to 0..1 scale
  // Blend base with propagated signal (simple mean; coverage-weighting is a V1 refinement).
  let vi = (base + sProp) / 2

  const topShare = Math.max(...shares) / den
  if (topShare > CONC_THRESHOLD) vi *= CONC_PENALTY

  return clamp(Math.min(VI_CAP, vi), 0, VI_CAP)
}

// ─── §07 — Pₛ: penalty multiplier ─────────────────────────────────────────────
export function penalty(flags: PenaltyFlag[], now: Date): number {
  let prod = 1
  for (const f of flags) {
    if (f.status !== 'upheld') continue
    if (f.expiresAt && f.expiresAt.getTime() <= now.getTime()) continue
    prod *= 1 - clamp(f.pk, 0, 1)
  }
  return 1 - prod
}

export function hasUpheldCritical(flags: PenaltyFlag[], now: Date): boolean {
  return flags.some(
    (f) =>
      f.status === 'upheld' &&
      f.severity === 'CRITICAL' &&
      !(f.expiresAt && f.expiresAt.getTime() <= now.getTime()),
  )
}

// ─── Tier mapping ─────────────────────────────────────────────────────────────
export function tierFromScore(score: number | null): Tier {
  if (score === null) return 'Watch'
  for (const t of TIER_THRESHOLDS) {
    if (score >= t.min) return t.tier
  }
  return 'Watch'
}

// ─── §09 — Dominant factor ────────────────────────────────────────────────────
export function dominantFactor(contributions: FactorContribution[]): Dominant {
  const total = contributions.reduce((s, c) => s + c.contribution, 0)
  if (total <= 0) return null
  let leader = contributions[0]!
  for (const c of contributions) if (c.contribution > leader.contribution) leader = c
  const share = leader.contribution / total
  if (share < BALANCED_THRESHOLD) return BALANCED
  return leader.code
}

// ─── §10 — Full recompute ─────────────────────────────────────────────────────
export function computeTrustScore(input: ComputeInput): ComputeResult {
  const now = input.now ?? new Date()
  const weights = ROLE_FACTOR_WEIGHTS[input.role] ?? {}
  // KYB verification floor: legal verification guarantees a minimum Vᵢ so it
  // lifts the score (not just a badge). 0 when no level is supplied.
  const viFloor = input.kybLevel ? (KYB_VI_FLOOR[input.kybLevel] ?? 0) : 0

  const contributions: FactorContribution[] = input.factors.map((f) => {
    const Wi = weights[f.code] ?? 0
    // The decay class defaults to the factor's canonical class (evidence type),
    // not a per-row guess from elapsed days. Elapsed days still drive the decay.
    const cls = f.decayClass ?? FACTOR_DECAY_CLASS[f.code] ?? 'B'
    const Di = f.Di ?? (f.observedAt ? decayFromDate(f.observedAt, cls, now) : 1)
    const Fi = clamp(f.Fi, 0, 100)
    const Vi = clamp(Math.max(f.Vi, viFloor), 0, 1)
    return { code: f.code, Fi, Wi, Di, Vi, contribution: Fi * Wi * Di * Vi }
  })

  const rawScore = contributions.reduce((s, c) => s + c.contribution, 0)
  const Ps = penalty(input.flags ?? [], now)
  const scoreUncapped = rawScore * (1 - Ps)
  const score = round1(clamp(scoreUncapped, 0, 100))

  let tier = tierFromScore(score)
  // Hard cap: an upheld CRITICAL flag pins the tier no higher than the configured
  // cap, regardless of the numeric score (spec-algorithm §07).
  if (
    hasUpheldCritical(input.flags ?? [], now) &&
    rankTier(tier) > rankTier(TIER_CAP_ON_CRITICAL)
  ) {
    tier = TIER_CAP_ON_CRITICAL
  }
  // Role ceiling: a reseller role with an unverified upstream source can't exceed
  // its configured tier. Applies on top of the numeric score and the CRITICAL cap.
  // V1: a verified upstream source (upstreamVerified) lifts this ceiling, since the
  // reseller's trust is now anchored to a legally-verified producer.
  const roleCeiling = ROLE_TIER_CEILING[input.role]
  if (
    roleCeiling &&
    !input.upstreamVerified &&
    rankTier(tier) > rankTier(roleCeiling)
  ) {
    tier = roleCeiling
  }

  return {
    score,
    rawScore: round1(rawScore),
    Ps: Math.round(Ps * 1000) / 1000,
    tier,
    dominant: dominantFactor(contributions),
    contributions,
  }
}

function rankTier(t: Tier): number {
  const order: Record<Tier, number> = {
    Platinum: 4,
    Gold: 3,
    Silver: 2,
    Bronze: 1,
    Watch: 0,
  }
  return order[t]
}

// ─── Weight matrix invariant (ΣWi = 1 per role) ───────────────────────────────
/** Returns roles whose weights don't sum to ~1.0 (tolerance for rounding). */
export function validateWeightMatrix(tolerance = 1e-6): RoleCode[] {
  const bad: RoleCode[] = []
  for (const role of Object.keys(ROLE_FACTOR_WEIGHTS) as RoleCode[]) {
    const sum = Object.values(ROLE_FACTOR_WEIGHTS[role]).reduce((s, w) => s + (w ?? 0), 0)
    if (Math.abs(sum - 1) > tolerance) bad.push(role)
  }
  return bad
}

export { BALANCED }
