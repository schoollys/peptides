import { describe, expect, it } from 'vitest'
import {
  BALANCED,
  baseVi,
  computeTrustScore,
  decay,
  dominantFactor,
  FACTOR_DECAY_CLASS,
  HALF_LIFE_DAYS,
  KYB_VI_FLOOR,
  penalty,
  propagatedVi,
  tierFromScore,
  validateWeightMatrix,
  VI_CAP,
  type FactorContribution,
  type PenaltyFlag,
} from '../src/index.js'

const NOW = new Date('2026-06-23T00:00:00Z')
const daysAgo = (n: number): Date => new Date(NOW.getTime() - n * 86_400_000)

describe('decay (§04)', () => {
  it('is 1.0 at age 0', () => {
    expect(decay(0, 'B')).toBeCloseTo(1, 10)
  })
  it('halves after one half-life', () => {
    expect(decay(HALF_LIFE_DAYS.B, 'B')).toBeCloseTo(0.5, 10)
  })
  it('never drops below the class floor', () => {
    expect(decay(100_000, 'C')).toBeGreaterThan(0)
    expect(decay(100_000, 'C')).toBeCloseTo(0.15, 10)
  })
})

describe('baseVi (§05)', () => {
  it('uses documented base + slope', () => {
    // 0.40 + (100/100)*0.55 = 0.95
    expect(baseVi(100, false)).toBeCloseTo(0.95, 10)
    expect(baseVi(0, false)).toBeCloseTo(0.4, 10)
  })
  it('applies blind lambda', () => {
    expect(baseVi(100, true)).toBeCloseTo(0.95 * 0.85, 10)
  })
})

describe('propagatedVi (§06)', () => {
  it('returns base (capped) with no neighbors', () => {
    expect(propagatedVi(0.7, [])).toBeCloseTo(0.7, 10)
    expect(propagatedVi(0.99, [])).toBeCloseTo(VI_CAP, 10)
  })
  it('never exceeds the cap', () => {
    const vi = propagatedVi(0.9, [{ subscore: 100, lotShare: 1 }])
    expect(vi).toBeLessThanOrEqual(VI_CAP + 1e-9)
  })
})

describe('penalty (§07)', () => {
  it('combines upheld flags multiplicatively', () => {
    const flags: PenaltyFlag[] = [
      { type: 'a', pk: 0.1, status: 'upheld', severity: 'WARNING' },
      { type: 'b', pk: 0.2, status: 'upheld', severity: 'WARNING' },
    ]
    // 1 - (0.9 * 0.8) = 0.28
    expect(penalty(flags, NOW)).toBeCloseTo(0.28, 10)
  })
  it('ignores open / dismissed / expired flags', () => {
    const flags: PenaltyFlag[] = [
      { type: 'open', pk: 0.5, status: 'open', severity: 'WARNING' },
      { type: 'dismissed', pk: 0.5, status: 'dismissed', severity: 'WARNING' },
      {
        type: 'expired',
        pk: 0.5,
        status: 'upheld',
        severity: 'WARNING',
        expiresAt: new Date('2020-01-01T00:00:00Z'),
      },
    ]
    expect(penalty(flags, NOW)).toBeCloseTo(0, 10)
  })
})

describe('tierFromScore', () => {
  it('maps v1.0.0 thresholds 78/60/42/20', () => {
    expect(tierFromScore(85)).toBe('Platinum')
    expect(tierFromScore(78)).toBe('Platinum')
    expect(tierFromScore(70)).toBe('Gold')
    expect(tierFromScore(50)).toBe('Silver')
    expect(tierFromScore(25)).toBe('Bronze')
    expect(tierFromScore(12)).toBe('Watch')
    expect(tierFromScore(null)).toBe('Watch')
  })
})

describe('dominantFactor (§09)', () => {
  const mk = (code: any, contribution: number): FactorContribution => ({
    code,
    Fi: 0,
    Wi: 0,
    Di: 0,
    Vi: 0,
    contribution,
  })
  it('returns null when total is 0', () => {
    expect(dominantFactor([mk('QEF', 0)])).toBeNull()
  })
  it('returns BALANCED below threshold', () => {
    // four equal contributors → 25% each < 40%
    expect(
      dominantFactor([mk('QEF', 10), mk('PCF', 10), mk('SCIF', 10), mk('TRF', 10)]),
    ).toBe(BALANCED)
  })
  it('returns the leader above threshold', () => {
    expect(dominantFactor([mk('QEF', 50), mk('PCF', 10), mk('SCIF', 10)])).toBe('QEF')
  })
})

describe('weight matrix invariant', () => {
  it('every role sums to 1.0', () => {
    expect(validateWeightMatrix()).toEqual([])
  })
})

describe('computeTrustScore — worked example (§12 MANUFACTURER weights)', () => {
  // The spec-algorithm §12 worked example uses the production matrix
  // {QEF .3, PCF .2, SCIF .2, TRF .15, CCF .1, CVF .05}, which is now the
  // MANUFACTURER role. FRF carries no weight there, so it contributes 0.
  it('matches the recomputed worked example', () => {
    const res = computeTrustScore({
      role: 'MANUFACTURER',
      now: NOW,
      factors: [
        { code: 'QEF', Fi: 88, Di: 0.92, Vi: 0.8 },
        { code: 'TRF', Fi: 75, Di: 0.85, Vi: 0.78 },
        { code: 'SCIF', Fi: 70, Di: 0.95, Vi: 0.65 },
        { code: 'FRF', Fi: 80, Di: 0.7, Vi: 0.72 },
        { code: 'CVF', Fi: 60, Di: 0.88, Vi: 0.6 },
      ],
      flags: [{ type: 'minor', pk: 0.05, status: 'upheld', severity: 'WARNING' }],
    })

    expect(res.rawScore).toBeCloseTo(37.1, 1)
    expect(res.score).toBeCloseTo(35.3, 1)
    expect(res.dominant).toBe('QEF') // 19.43 / 37.12 ≈ 52% > 40%
    expect(res.Ps).toBeCloseTo(0.05, 10)
    expect(res.tier).toBe('Bronze') // 35.3 ∈ [20,42)
  })

  it('drops to Watch tier when an upheld CRITICAL flag is present', () => {
    const res = computeTrustScore({
      role: 'VENDOR',
      now: NOW,
      factors: [{ code: 'QEF', Fi: 90, Di: 1, Vi: 0.9 }],
      flags: [{ type: 'recall', pk: 0.1, status: 'upheld', severity: 'CRITICAL' }],
    })
    expect(res.tier).toBe('Watch')
  })
})

describe('per-factor decay class default (P0)', () => {
  it('maps regulatory factors to slow classes and logistics to fast', () => {
    expect(FACTOR_DECAY_CLASS.QEF).toBe('A')
    expect(FACTOR_DECAY_CLASS.PCF).toBe('A')
    expect(FACTOR_DECAY_CLASS.CCF).toBe('A')
    expect(FACTOR_DECAY_CLASS.TRF).toBe('A')
    expect(FACTOR_DECAY_CLASS.SCIF).toBe('B')
    expect(FACTOR_DECAY_CLASS.FRF).toBe('C')
    expect(FACTOR_DECAY_CLASS.CVF_B).toBe('D')
  })

  it('defaults the decay class from the factor code when none is supplied', () => {
    // Same Fi/Vi, observed 83 days ago, no explicit Di/decayClass: QEF (class A,
    // half-life 365) must decay far less than FRF (class C, half-life 45).
    const qef = computeTrustScore({
      role: 'MANUFACTURER',
      now: NOW,
      factors: [{ code: 'QEF', Fi: 90, Vi: 0.9, observedAt: daysAgo(83) }],
    })
    const frf = computeTrustScore({
      role: 'VENDOR',
      now: NOW,
      factors: [{ code: 'FRF', Fi: 90, Vi: 0.9, observedAt: daysAgo(83) }],
    })
    const qefDi = qef.contributions[0]!.Di
    const frfDi = frf.contributions[0]!.Di
    expect(qefDi).toBeCloseTo(Math.pow(2, -83 / 365), 6) // ≈ 0.854
    expect(frfDi).toBeCloseTo(Math.pow(2, -83 / 45), 6) // ≈ 0.279
    expect(qefDi).toBeGreaterThan(frfDi)
  })

  it('an explicit decayClass still overrides the canonical default', () => {
    const res = computeTrustScore({
      role: 'MANUFACTURER',
      now: NOW,
      factors: [{ code: 'QEF', Fi: 90, Vi: 0.9, observedAt: daysAgo(45), decayClass: 'C' }],
    })
    expect(res.contributions[0]!.Di).toBeCloseTo(0.5, 6) // class C half-life = 45d
  })
})

describe('KYB verification Vᵢ-floor (P0)', () => {
  it('exposes a monotonic floor by level', () => {
    expect(KYB_VI_FLOOR.L0).toBe(0)
    expect(KYB_VI_FLOOR.L1).toBeLessThan(KYB_VI_FLOOR.L2)
    expect(KYB_VI_FLOOR.L2).toBeLessThan(KYB_VI_FLOOR.L3)
    expect(KYB_VI_FLOOR.L3).toBeLessThanOrEqual(VI_CAP)
  })

  it('lifts a low-confidence Vᵢ up to the L3 floor', () => {
    const factors = [{ code: 'QEF' as const, Fi: 90, Di: 1, Vi: 0.55 }]
    const noKyb = computeTrustScore({ role: 'MANUFACTURER', now: NOW, factors })
    const l3 = computeTrustScore({ role: 'MANUFACTURER', now: NOW, factors, kybLevel: 'L3' })
    expect(noKyb.contributions[0]!.Vi).toBeCloseTo(0.55, 6)
    expect(l3.contributions[0]!.Vi).toBeCloseTo(KYB_VI_FLOOR.L3, 6)
    expect(l3.score).toBeGreaterThan(noKyb.score)
  })

  it('never lowers a Vᵢ that already exceeds the floor', () => {
    const factors = [{ code: 'QEF' as const, Fi: 90, Di: 1, Vi: 0.95 }]
    const l3 = computeTrustScore({ role: 'MANUFACTURER', now: NOW, factors, kybLevel: 'L3' })
    expect(l3.contributions[0]!.Vi).toBeCloseTo(0.95, 6)
  })

  it('L0 applies no floor', () => {
    const factors = [{ code: 'QEF' as const, Fi: 90, Di: 1, Vi: 0.3 }]
    const l0 = computeTrustScore({ role: 'MANUFACTURER', now: NOW, factors, kybLevel: 'L0' })
    expect(l0.contributions[0]!.Vi).toBeCloseTo(0.3, 6)
  })
})

describe('P0 regression — verified producer with aged data is not buried in Watch', () => {
  // Mirrors the Adragos case: L3-verified fill-finish CDMO, data ~83 days old.
  // Before P0 (uniform class-C decay from days) it scored ~17 → Watch. With
  // per-factor decay classes (QEF/PCF class A) it must land in a sane tier.
  it('lands above Watch', () => {
    const res = computeTrustScore({
      role: 'FILL_FINISH',
      now: NOW,
      kybLevel: 'L3',
      factors: [
        { code: 'QEF', Fi: 82, Vi: 0.9, observedAt: daysAgo(83) },
        { code: 'PCF', Fi: 80, Vi: 0.9, observedAt: daysAgo(83) },
        { code: 'SCIF', Fi: 78, Vi: 0.9, observedAt: daysAgo(83) },
      ],
    })
    expect(res.score).toBeGreaterThan(20) // not Watch
    expect(['Bronze', 'Silver', 'Gold']).toContain(res.tier)
  })
})

describe('role tier ceiling (RETAILER, unverified upstream)', () => {
  // A retailer with a Platinum-level numeric score is capped at Gold until
  // Vᵢ-propagation lands (V1). RETAILER weights: {FRF .45, QEF .3, PCF .25}.
  it('caps a high-scoring RETAILER at Gold', () => {
    const res = computeTrustScore({
      role: 'RETAILER',
      now: NOW,
      factors: [
        { code: 'FRF', Fi: 98, Di: 1, Vi: 0.98 },
        { code: 'QEF', Fi: 96, Di: 1, Vi: 0.96 },
        { code: 'PCF', Fi: 95, Di: 1, Vi: 0.95 },
      ],
    })
    expect(res.score).toBeGreaterThanOrEqual(78) // numerically Platinum
    expect(res.tier).toBe('Gold') // but capped by the role ceiling
  })

  it('leaves a sub-Gold RETAILER untouched', () => {
    const res = computeTrustScore({
      role: 'RETAILER',
      now: NOW,
      factors: [{ code: 'FRF', Fi: 58, Di: 0.86, Vi: 0.86 }],
    })
    expect(res.tier).not.toBe('Platinum')
    expect(['Silver', 'Bronze', 'Watch']).toContain(res.tier)
  })

  it('lifts the ceiling when the upstream source is verified (V1)', () => {
    const factors = [
      { code: 'FRF' as const, Fi: 98, Di: 1, Vi: 0.98 },
      { code: 'QEF' as const, Fi: 96, Di: 1, Vi: 0.96 },
      { code: 'PCF' as const, Fi: 95, Di: 1, Vi: 0.95 },
    ]
    const capped = computeTrustScore({ role: 'RETAILER', now: NOW, factors })
    const lifted = computeTrustScore({ role: 'RETAILER', now: NOW, factors, upstreamVerified: true })
    expect(capped.tier).toBe('Gold')
    expect(lifted.tier).toBe('Platinum') // ceiling lifted ⇒ follows numeric score
    expect(lifted.score).toBe(capped.score) // score itself is unchanged
  })

  it('upstreamVerified does not bypass the CRITICAL hard cap', () => {
    const res = computeTrustScore({
      role: 'RETAILER',
      now: NOW,
      factors: [{ code: 'FRF', Fi: 98, Di: 1, Vi: 0.98 }],
      flags: [{ type: 'recall', pk: 0.1, status: 'upheld', severity: 'CRITICAL' }],
      upstreamVerified: true,
    })
    expect(res.tier).toBe('Watch')
  })
})
