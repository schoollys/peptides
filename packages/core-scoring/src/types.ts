/**
 * Core scoring types. Mirrors db/schema.sql enums and spec-algorithm.html.
 * Kept dependency-free so this package can be consumed by api, workers and web.
 */

export type FactorCode =
  | 'QEF'
  | 'PCF'
  | 'SCIF'
  | 'TRF'
  | 'FRF'
  | 'CCF'
  | 'CVF'
  | 'CVF_B'
  | 'RF'

export const FACTOR_CODES: readonly FactorCode[] = [
  'QEF',
  'PCF',
  'SCIF',
  'TRF',
  'FRF',
  'CCF',
  'CVF',
  'CVF_B',
  'RF',
] as const

export type DecayClass = 'A' | 'B' | 'C' | 'D'

export type RoleCode =
  | 'MANUFACTURER'
  | 'FILL_FINISH'
  | 'VENDOR'
  | 'DISTRIBUTOR'
  | 'LABORATORY'
  | 'RETAILER'
  | 'CONSULTANT'
  | 'IMPORTER'

export type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Watch'

/** KYB verification level (schema.sql identity_verifications.level). */
export type KybLevel = 'L0' | 'L1' | 'L2' | 'L3'

/** Sentinel returned by dominantFactor() when no factor dominates. */
export const BALANCED = 'BALANCED' as const
export type Dominant = FactorCode | typeof BALANCED | null

/** A single upheld penalty flag contributing to Ps. */
export interface PenaltyFlag {
  type: string
  /** per-flag penalty weight pk ∈ [0,1) */
  pk: number
  status: 'open' | 'upheld' | 'dismissed' | 'expired'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  /** optional expiry; flags past expiry are excluded from the product */
  expiresAt?: Date
}

/**
 * One factor input ready for scoring. Fi is the already-normalized 0..100
 * quality value (band mapping happens upstream / in normalizeFactor()).
 */
export interface FactorContribInput {
  code: FactorCode
  /** Fi — normalized quality, 0..100 */
  Fi: number
  /** Di — freshness multiplier, floor..1. If omitted, computed from observedAt + decayClass. */
  Di?: number
  /** Vi — verification multiplier, 0..1 (already propagated/capped upstream). */
  Vi: number
  /** Used to derive Di when Di is not provided. */
  observedAt?: Date
  decayClass?: DecayClass
}

export interface ComputeInput {
  role: RoleCode
  factors: FactorContribInput[]
  flags?: PenaltyFlag[]
  /** evaluation time; defaults to now() */
  now?: Date
  /**
   * V1 — set when the participant has a verified upstream source (a counterparty
   * link to a legally-verified producer). Lifts the role tier ceiling
   * (ROLE_TIER_CEILING) for reseller roles, since their trust is no longer
   * derived from an unverified source. Vᵢ-propagation is applied by the caller
   * (graph layer) before scoring; this flag only governs the ceiling.
   */
  upstreamVerified?: boolean
  /**
   * KYB verification level of the participant. Applies a Vᵢ-floor (KYB_VI_FLOOR)
   * so legal verification actually lifts the Trust Score, not just a display
   * badge: a fully-verified producer's evidence carries a minimum trust
   * multiplier regardless of the source-confidence-derived Vᵢ. Optional; when
   * omitted no floor is applied.
   */
  kybLevel?: KybLevel
}

export interface FactorContribution {
  code: FactorCode
  Fi: number
  Wi: number
  Di: number
  Vi: number
  /** Fi·Wi·Di·Vi */
  contribution: number
}

export interface ComputeResult {
  /** final Trust Score 0..100, one decimal */
  score: number
  /** raw score before penalty (Σ contributions) */
  rawScore: number
  Ps: number
  tier: Tier
  dominant: Dominant
  contributions: FactorContribution[]
}
