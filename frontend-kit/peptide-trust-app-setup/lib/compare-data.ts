/**
 * lib/compare-data.ts
 *
 * Derives all comparison data from the SINGLE SOURCE OF TRUTH (lib/participants.ts).
 * This guarantees that a given participant id (e.g. p-001) resolves to the same
 * name / score / dominant factor on the landing page, catalog, profile AND compare.
 *
 * Previously this module shipped its own divergent MOCK_DB, which caused the same
 * id to show different participants across pages — now removed.
 */

import {
  PARTICIPANTS,
  PARTICIPANTS_BY_ID,
  ROLE_LABELS,
  FACTOR_LABELS as PARTICIPANT_FACTOR_LABELS,
  scoreToTier as participantScoreToTier,
  type Participant,
  type Tier,
} from '@/lib/participants'

// ─── Factor codes & labels (single source) ───────────────────────────────────
export const FACTOR_CODES = ['QEF', 'PCF', 'SCIF', 'TRF', 'FRF', 'CCF', 'CVF', 'CVF_B', 'RF'] as const
export type FactorCode = typeof FACTOR_CODES[number]

// Re-export the canonical factor labels so compare, profile and trust-model agree.
export const FACTOR_LABELS: Record<FactorCode, string> = PARTICIPANT_FACTOR_LABELS

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CompareParticipant {
  id: string
  display_name: string
  role_code: string
  role_label: string
  score: number | null
  tier: Tier
  dominant_factor: FactorCode | null
  is_balanced: boolean
  verified_legal: boolean
  /** Fᵢ values 0–100; null = participant has no measurement for this factor */
  factors: Record<FactorCode, number | null>
  independent_tests: number
  updated_days_ago: number
}

// ─── Tier thresholds (single source) ──────────────────────────────────────────
export function scoreToTier(score: number | null): Tier {
  return participantScoreToTier(score)
}

// ─── Mapping: canonical Participant → CompareParticipant ───────────────────────
export function toCompareParticipant(p: Participant): CompareParticipant {
  const factors = {} as Record<FactorCode, number | null>
  for (const code of FACTOR_CODES) {
    const entry = p.factors.find((f) => f.code === code)
    factors[code] = entry ? entry.value : null
  }

  return {
    id: p.id,
    display_name: p.display_name,
    role_code: p.role_code,
    role_label: ROLE_LABELS[p.role_code],
    score: p.score,
    tier: p.tier,
    dominant_factor: p.dominant_factor,
    is_balanced: p.is_balanced,
    verified_legal: p.verified_legal,
    factors,
    independent_tests: p.tests_count,
    updated_days_ago: p.updated_days_ago,
  }
}

// All searchable participants for the "add" dialog (canonical order, all 12)
export const ALL_PARTICIPANTS: Pick<
  CompareParticipant,
  'id' | 'display_name' | 'role_label' | 'tier' | 'score'
>[] = PARTICIPANTS.map((p) => ({
  id: p.id,
  display_name: p.display_name,
  role_label: ROLE_LABELS[p.role_code],
  tier: p.tier,
  score: p.score,
}))

export function getCompareParticipants(ids: string[]): CompareParticipant[] {
  return ids
    .map((id) => PARTICIPANTS_BY_ID[id.trim()])
    .filter((p): p is Participant => Boolean(p))
    .slice(0, 5) // max 5 columns
    .map(toCompareParticipant)
}

// Sort by Score desc, then by avg Vᵢ coverage (sum of known factors as proxy)
export function sortByBRRank(participants: CompareParticipant[]): CompareParticipant[] {
  const factorSum = (p: CompareParticipant) =>
    FACTOR_CODES.reduce((acc, f) => acc + (p.factors[f] ?? 0), 0)

  return [...participants].sort((a, b) => {
    const sa = a.score ?? -1
    const sb = b.score ?? -1
    if (sb !== sa) return sb - sa
    return factorSum(b) - factorSum(a)
  })
}

// Find the best participant id for each factor (ignores null = no data).
// Returns '' for a factor that no participant has data for.
export function getBestByFactor(
  participants: CompareParticipant[]
): Record<FactorCode, string> {
  const result = {} as Record<FactorCode, string>
  for (const code of FACTOR_CODES) {
    let bestId = ''
    let bestVal = -1
    for (const p of participants) {
      const v = p.factors[code]
      if (v != null && v > bestVal) {
        bestVal = v
        bestId = p.id
      }
    }
    result[code] = bestId
  }
  return result
}
