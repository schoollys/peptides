/**
 * lib/incidents-data.ts
 *
 * Single source for incident log — derived directly from PARTICIPANTS flags.
 * Each flag with severity WARNING or CRITICAL (or any flag on a Watch-tier participant)
 * produces a corresponding incident entry. Sorted newest-first.
 */

import { PARTICIPANTS } from '@/lib/participants'
import type { FlagSeverity } from '@/lib/participants'

export type IncidentSeverity = FlagSeverity   // INFO | WARNING | CRITICAL
export type IncidentStatus   = 'open' | 'upheld' | 'dismissed'

export interface Incident {
  id: string                  // inc-{participantId}-{flagId}
  participant_id: string
  participant_name: string
  violation_type: string      // human-readable type label
  severity: IncidentSeverity
  description: string
  anchor_hash: string         // participant's latest_anchor_hash
  status: IncidentStatus
  raised_at: string           // ISO timestamp from flag
}

// Map raw flag types to readable Russian labels
const TYPE_LABELS: Record<string, string> = {
  SCORE_DECLINE:    'Падение Trust Score',
  TEST_DISCREPANCY: 'Расхождение тестов',
  KYB_MISSING:      'Отсутствие KYB-идентификации',
  KYB_INCOMPLETE:   'Неполный KYB',
  PROVISIONAL_DATA: 'Недостаточно данных',
  LOW_TEST_COUNT:   'Мало независимых тестов',
  COMPLIANCE_NOTICE:'Уведомление о соответствии',
  LEGAL_UNVERIFIED: 'Юридическая верификация',
}

// Map flag status → incident status
function toIncidentStatus(flagStatus: string): IncidentStatus {
  if (flagStatus === 'RESOLVED')   return 'dismissed'
  if (flagStatus === 'MONITORING') return 'upheld'
  return 'open'
}

// Build the canonical incident list from all participant flags
function buildIncidents(): Incident[] {
  const list: Incident[] = []

  for (const p of PARTICIPANTS) {
    for (const flag of p.flags) {
      // Include all flags on Watch-tier participants, plus WARNING/CRITICAL on others
      const include =
        p.tier === 'Watch' ||
        flag.severity === 'CRITICAL' ||
        flag.severity === 'WARNING'

      if (!include) continue

      list.push({
        id:               `inc-${p.id}-${flag.id}`,
        participant_id:   p.id,
        participant_name: p.display_name,
        violation_type:   TYPE_LABELS[flag.type] ?? flag.type,
        severity:         flag.severity,
        description:      flag.message,
        anchor_hash:      flag.anchor_hash ?? p.latest_anchor_hash,
        status:           toIncidentStatus(flag.status),
        raised_at:        flag.raised_at,
      })
    }
  }

  // Sort newest first
  return list.sort(
    (a, b) => new Date(b.raised_at).getTime() - new Date(a.raised_at).getTime()
  )
}

export const INCIDENTS: Incident[] = buildIncidents()

// Index by participant_id for quick profile-tab lookups
export const INCIDENTS_BY_PARTICIPANT: Record<string, Incident[]> =
  INCIDENTS.reduce<Record<string, Incident[]>>((acc, inc) => {
    if (!acc[inc.participant_id]) acc[inc.participant_id] = []
    acc[inc.participant_id].push(inc)
    return acc
  }, {})
