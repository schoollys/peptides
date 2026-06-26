/**
 * Scoring parameters — PROVISIONAL v0.9.
 *
 * SOURCE OF TRUTH for numbers: reports/spec-config-parameters.html (Parameters Registry).
 * Every value marked `TODO(SME)` is a placeholder awaiting SME sign-off (v0.9 → v1.0).
 * Changing any of these MUST bump `ALGO_VERSION` (forward-only; historical
 * score_events stay under their version — see db/schema.sql BR-VERSION).
 *
 * Values that ARE documented in spec-algorithm.html are cited inline.
 */

import type { DecayClass, FactorCode, KybLevel, RoleCode, Tier } from './types.js'

export const ALGO_VERSION = 'v1.3.0' // +per-factor decay classes (FACTOR_DECAY_CLASS) + KYB Vᵢ-floor

// ─── Vi: verification multiplier (spec-algorithm §05) ─────────────────────────
export const VI_BASE = 0.4 // documented
export const VI_SLOPE = 0.55 // documented
export const LAMBDA_BLIND = 0.85 // documented
export const VI_CAP = 0.85 // documented (propagation cap §06)

// ─── Vi propagation concentration penalty (spec-algorithm §06) ────────────────
export const CONC_THRESHOLD = 0.6 // documented
export const CONC_PENALTY = 0.9 // TODO(SME): penalty multiplier when one source dominates

// ─── Di: freshness decay (spec-algorithm §04 / schema half-life 365/120/45/90) ─
export const HALF_LIFE_DAYS: Record<DecayClass, number> = {
  A: 365, // slow-moving (process, licenses)
  B: 120, // synthesis quality, supply-chain
  C: 45, // logistics, cold-chain, responsiveness
  D: 90, // buyer confirmations
}

/** Floor so history never decays fully to zero. TODO(SME): confirm per-class floors. */
export const DECAY_FLOOR: Record<DecayClass, number> = {
  A: 0.25,
  B: 0.2,
  C: 0.15,
  D: 0.2,
}

/**
 * Canonical decay class per FACTOR (spec-algorithm §04). The decay class is a
 * property of the EVIDENCE TYPE — how fast that kind of signal goes stale — NOT
 * of how many days ago it was observed. Elapsed time (dtDays) drives the actual
 * decay; the class only sets the half-life. Regulatory evidence (GMP/ISO/
 * licenses, QMS, accreditation, track-record) is slow-moving (A, 365d); supply-
 * chain/risk medium (B, 120d); fulfilment/cold-chain fast (C, 45d); buyer
 * confirmations (D, 90d). Used as the default when a factor input omits an
 * explicit decayClass. TODO(SME): confirm per-factor mapping at v1.0.
 */
export const FACTOR_DECAY_CLASS: Record<FactorCode, DecayClass> = {
  QEF: 'A', // quality: GMP/ISO/pharma licenses — slow-moving
  PCF: 'A', // process control / QMS — slow-moving
  CCF: 'A', // compliance / accreditation — slow-moving
  TRF: 'A', // track record / reputation — slow-moving
  SCIF: 'B', // supply-chain integrity — medium
  RF: 'B', // residual risk signal — medium
  FRF: 'C', // fulfilment / logistics / cold-chain — fast-moving
  CVF: 'D', // buyer confirmations
  CVF_B: 'D', // buyer confirmations (secondary)
}

/**
 * KYB verification Vᵢ-floor. A legally-verified participant's evidence carries a
 * minimum verification multiplier regardless of the source-confidence-derived
 * Vᵢ, so KYB actually LIFTS the Trust Score (it isn't just a display badge).
 * Applied as `Vᵢ = max(Vᵢ, KYB_VI_FLOOR[level])` per factor. Floors stay at/below
 * the propagation cap (VI_CAP = 0.85). TODO(SME): calibrate L1–L3 levels.
 */
export const KYB_VI_FLOOR: Record<KybLevel, number> = {
  L0: 0, // unverified — no floor
  L1: 0.5, // domain/contact verified
  L2: 0.65, // legal entity + registration number
  L3: 0.8, // full regulatory (GMP/ISO/licence)
}

// ─── Tier thresholds (lib/participants.ts scoreToTier — matches /tiers UI) ─────
// Recalibrated to the engine's real output range (Vi/Di-discounted). An ideal,
// fully-verified, fresh, well-covered participant tops out ~85; Watch is reserved
// for near-zero evidence or a CRITICAL hard-cap.
export const TIER_THRESHOLDS: { min: number; tier: Tier }[] = [
  { min: 78, tier: 'Platinum' },
  { min: 60, tier: 'Gold' },
  { min: 42, tier: 'Silver' },
  { min: 20, tier: 'Bronze' },
  { min: -Infinity, tier: 'Watch' },
]

/** Hard tier cap when a CRITICAL penalty flag is upheld (spec-algorithm §07). */
export const TIER_CAP_ON_CRITICAL: Tier = 'Watch' // TODO(SME): confirm cap level

/**
 * Per-role tier ceiling. Buyer-facing reseller roles whose trust is derived from
 * an unverified upstream source are capped until Vᵢ-propagation lands (V1).
 * RETAILER (pure reseller/dropshipper of others' brands) tops out at Gold in MVP.
 * TODO(SME): confirm ceiling level once propagation is calibrated.
 */
export const ROLE_TIER_CEILING: Partial<Record<RoleCode, Tier>> = {
  RETAILER: 'Gold',
}

// ─── Dominant factor (spec-algorithm §09) ─────────────────────────────────────
/** Leader must hold ≥ this share of total contribution, else profile is BALANCED. */
export const BALANCED_THRESHOLD = 0.4 // TODO(SME): provisional (worked example QEF 45% > 40% ⇒ dominant)

// ─── Wi: role × factor weight matrix (ΣWi = 1 per role) ────────────────────────
// PROVISIONAL. The full 22×9 matrix lives in the Parameters Registry under SME.
// MANUFACTURER = upstream synthesis plant / API-producer (B2B origin of quality):
// synthesis-quality heavy (mirrors the worked example in spec-algorithm §12).
// VENDOR = buyer-facing storefront/brand. V1: weights pivot toward fulfilment (FRF)
// while retaining quality signals (QEF/PCF/SCIF). FRF is the headline buyer-facing
// factor (now collected for vendors). CVF (buyer confirmations) is intentionally
// left out of the role weights until it is collected uniformly across vendors —
// otherwise vendors lacking CVF would be depressed. TODO(SME): add CVF weight once
// coverage is uniform; calibrate FRF share.
export const ROLE_FACTOR_WEIGHTS: Record<RoleCode, Partial<Record<FactorCode, number>>> = {
  // Weights aligned to factors actually collected per role (no weight on absent
  // factors, which would otherwise depress the score). ΣWi = 1 per role.
  MANUFACTURER: { QEF: 0.3, PCF: 0.2, SCIF: 0.2, TRF: 0.15, CCF: 0.1, CVF: 0.05 },
  // FILL_FINISH = contract fill & finish / CDMO: aseptic vialing + lyophilisation
  // of bulk API. Quality- and process-heavy; SCIF ties the finished vial back to
  // the source API lot; CVF_B captures verified B2B (brand/vendor) confirmations.
  // Mirrors the 22-role evaluation (artifacts/v2 §roles): QEF 35/PCF 30/SCIF 20/CVF-B 15.
  FILL_FINISH: { QEF: 0.35, PCF: 0.3, SCIF: 0.2, CVF_B: 0.15 },
  VENDOR: { FRF: 0.3, QEF: 0.25, PCF: 0.2, SCIF: 0.15, TRF: 0.1 },
  LABORATORY: { PCF: 0.3, QEF: 0.3, SCIF: 0.2, TRF: 0.1, CCF: 0.05, CVF: 0.05 },
  DISTRIBUTOR: { SCIF: 0.25, CCF: 0.2, QEF: 0.2, TRF: 0.15, PCF: 0.15, RF: 0.05 },
  IMPORTER: { SCIF: 0.25, CCF: 0.25, QEF: 0.2, TRF: 0.15, PCF: 0.15 },
  CONSULTANT: { CVF: 0.35, QEF: 0.25, PCF: 0.25, CCF: 0.15 },
  RETAILER: { FRF: 0.45, QEF: 0.3, PCF: 0.25 },
}
