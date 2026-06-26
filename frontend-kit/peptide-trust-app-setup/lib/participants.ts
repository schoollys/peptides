/**
 * lib/participants.ts — SINGLE SOURCE OF TRUTH for all participant data.
 *
 * catalog-data.ts and profile-data.ts re-export from here.
 * recent-entries.tsx reads PARTICIPANTS directly.
 */

// ─── Shared types ─────────────────────────────────────────────────────────────

import { PARTICIPANTS_DATA } from './participants.data'

export type Tier            = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Watch'
export type RoleCode        = 'MANUFACTURER' | 'FILL_FINISH' | 'VENDOR' | 'DISTRIBUTOR' | 'LABORATORY' | 'RETAILER' | 'CONSULTANT' | 'IMPORTER'
export type DominantFactor  = 'QEF' | 'PCF' | 'SCIF' | 'TRF' | 'FRF' | 'CCF' | 'CVF' | 'CVF_B' | 'RF' | null
export type ParticipantStatus = 'ACTIVE' | 'PROVISIONAL' | 'SUSPENDED'
export type KybLevel        = 'L0' | 'L1' | 'L2' | 'L3'
export type FlagSeverity    = 'INFO' | 'WARNING' | 'CRITICAL'
export type FlagStatus      = 'OPEN' | 'RESOLVED' | 'MONITORING'
export type DiClass         = 'A' | 'B' | 'C' | 'D'

// ─── MVP anchor roles ─────────────────────────────────────────────────────────
// Anchor roles for the EU/CH MVP scope:
//   MANUFACTURER → Завод-синтез / API-producer: upstream B2B-источник качества
//                  (НЕ buyer-facing). Synthesis-quality heavy.
//   FILL_FINISH  → Фасовщик / CDMO: асептический розлив bulk API во флаконы +
//                  лиофилизация. Точка частой подмены; лотовая привязка к API.
//                  Quality/process-heavy (QEF/PCF/SCIF + CVF_B).
//   VENDOR       → RUO-вендор: витрина/бренд, у которого покупают (может
//                  перепродавать или иметь свой синтез).
//   LABORATORY   → Лаборатория-оракул (verification oracle, источник Vᵢ).
//   DISTRIBUTOR  → GB-организатор (group-buy organizer).
//   RETAILER     → Ритейлер/реселлер: тоже точка покупки, поэтому якорная, но с
//                  потолком тира (ROLE_TIER_CEILING) и пометкой «источник не
//                  верифицирован» — полное доверие даёт Vᵢ-пропагация (V1).
// Остальные коды — non-anchor (provisional coverage).

export const ANCHOR_ROLE_CODES: RoleCode[] = ['MANUFACTURER', 'FILL_FINISH', 'VENDOR', 'LABORATORY', 'DISTRIBUTOR', 'RETAILER']

/**
 * Per-role tier ceiling — mirrors core-scoring ROLE_TIER_CEILING (v1.0.0).
 * A reseller role whose trust is derived from an unverified upstream source is
 * capped until Vᵢ-propagation lands (V1).
 */
export const ROLE_TIER_CEILING: Partial<Record<RoleCode, Tier>> = {
  RETAILER: 'Gold',
}

/** Roles whose Score rests on an unverified upstream source (surface a notice). */
export function isUnverifiedSourceRole(role: RoleCode): boolean {
  return role === 'RETAILER'
}

export const ANCHOR_ROLE_LABELS: Record<RoleCode, string> = {
  MANUFACTURER: 'Завод-синтез',
  FILL_FINISH:  'Фасовщик (CDMO)',
  VENDOR: 'RUO-вендор',
  LABORATORY:   'Лаборатория-оракул',
  DISTRIBUTOR:  'GB-организатор',
  RETAILER:     'Ритейлер',
  CONSULTANT:   'Консультант',
  IMPORTER:     'Импортёр',
}

// ─── Label maps ───────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<RoleCode, string> = {
  MANUFACTURER: 'Завод-синтез',
  FILL_FINISH:  'Фасовщик (CDMO)',
  VENDOR: 'RUO-вендор',
  DISTRIBUTOR:  'GB-организатор',
  LABORATORY:   'Лаборатория-оракул',
  RETAILER:     'Ритейлер',
  CONSULTANT:   'Консультант',
  IMPORTER:     'Импортёр',
}

export const FACTOR_LABELS: Record<NonNullable<DominantFactor>, string> = {
  QEF:   'Качество энзимов',
  PCF:   'Протокол чистоты',
  SCIF:  'Стабильность цепочек',
  TRF:   'Тепловая резистентность',
  FRF:   'Поглощение фрагментов',
  CCF:   'Контроль концентрации',
  CVF:   'Валидация компонентов',
  CVF_B: 'Валидация компонентов B',
  RF:    'Поглощающая фракция',
}

export const TIER_ORDER: Record<Tier, number> = {
  Platinum: 0, Gold: 1, Silver: 2, Bronze: 3, Watch: 4,
}

// ─── Tier threshold function (must mirror core-scoring TIER_THRESHOLDS, v1.0.0) ──
// Platinum 78–100 / Gold 60–77 / Silver 42–59 / Bronze 20–41 / Watch <20.

export function scoreToTier(score: number | null): Tier {
  if (score === null) return 'Watch'
  if (score >= 78) return 'Platinum'
  if (score >= 60) return 'Gold'
  if (score >= 42) return 'Silver'
  if (score >= 20) return 'Bronze'
  return 'Watch'
}

/** Apply a role's tier ceiling (mirrors core-scoring ROLE_TIER_CEILING). */
export function capTierToRole(tier: Tier, role: RoleCode): Tier {
  const ceiling = ROLE_TIER_CEILING[role]
  if (ceiling && TIER_ORDER[tier] < TIER_ORDER[ceiling]) return ceiling
  return tier
}

// ─── Factor helpers ───────────────────────────────────────────────────────────

export interface FactorEntry {
  code: NonNullable<DominantFactor>
  label: string
  value: number
  v_i: number
  freshness_di: number
  di_class: DiClass
  contribution: number
}

export interface ScoreEvent {
  id: string
  score: number
  dominant_factor: DominantFactor
  algo_version: string
  anchor_hash: string
  computed_at: string
}

export interface Flag {
  id: string
  type: string
  severity: FlagSeverity
  status: FlagStatus
  message: string
  raised_at: string
  /** Unique on-chain anchor hash for THIS flag/incident (not the participant's latest) */
  anchor_hash?: string
}



// ─── Canonical participant record ─────────────────────────────────────────────

export interface Participant {
  // --- identity ---
  id: string
  display_name: string
  role_code: RoleCode
  status: ParticipantStatus
  jurisdiction: string
  domain: string
  // --- verification ---
  verified_legal: boolean
  kyb_level: KybLevel
  // --- score ---
  score: number | null          // one decimal, e.g. 94.7
  tier: Tier                    // derived from score via scoreToTier()
  dominant_factor: DominantFactor
  is_balanced: boolean
  trust_ceiling: number
  // --- activity ---
  tests_count: number
  updated_days_ago: number
  // --- algo ---
  algo_version: string
  latest_anchor_hash: string
  // --- detail data ---
  factors: FactorEntry[]
  flags: Flag[]
  score_events: ScoreEvent[]
  isAnchorRole: boolean   // true = one of 3 MVP anchor roles (EU/CH scope)
  provisional_reason?: string
  contacts?: {
    website?: string
    email?:   string
    telegram?: string
  }
}

// ─── 12 canonical participants ────────────────────────────────────────────────

export const PARTICIPANTS: Participant[] = PARTICIPANTS_DATA

// ─── Counterparty links (Vᵢ-пропагация, V1) ───────────────────────────────────
// Граф «кто у кого закупает». Направление: from (downstream, buyer-facing) → to
// (upstream-источник качества, обычно MANUFACTURER). В MVP связи только заводятся
// и визуализируются; реальное наследование Vᵢ через propagatedVi() включается в V1.
//   lot_share  — доля лотов downstream-участника из этого источника (вес агрегации)
//   blind_flag — источник раскрыт лишь частично (blind-линк) → lambda 0.85
//   lambda     — множитель доверия к ребру (1.0 обычный, 0.85 blind)
export interface CounterpartyLink {
  from_id: string
  to_id: string
  lot_share: number
  blind_flag: boolean
  lambda: number
}

// Direction: from (downstream, buyer-facing) → to (upstream source of quality).
// Only relationships explicitly documented in the registry CSV are seeded —
// these are distributors carrying named manufacturers' catalogues. VENDOR/RETAILER
// rows do NOT disclose an upstream source in the dataset, so they stay unlinked
// (and correctly remain capped under V1 — opaque resellers inherit no trust).
// NB: from_id/to_id are CSV-order slugs (p-NNN); re-check after regenerating data.
export const COUNTERPARTY_LINKS: CounterpartyLink[] = [
  // Cambridge Bioscience → Bachem: carries the full Bachem peptide catalogue.
  { from_id: 'p-030', to_id: 'p-001', lot_share: 0.40, blind_flag: false, lambda: 1.0 },
  // Nordic BioSite → JPT Peptide Technologies: distributes the JPT line.
  { from_id: 'p-035', to_id: 'p-004', lot_share: 0.25, blind_flag: false, lambda: 1.0 },
  // Nordic BioSite → Bio-Techne / R&D Systems: distributes the Bio-Techne line.
  { from_id: 'p-035', to_id: 'p-031', lot_share: 0.35, blind_flag: false, lambda: 1.0 },
  // Bio-Connect → Bio-Techne / R&D Systems: distributes R&D Systems products.
  { from_id: 'p-036', to_id: 'p-031', lot_share: 0.40, blind_flag: false, lambda: 1.0 },
  // Bio-Connect → JPT Peptide Technologies: distributes the JPT line.
  { from_id: 'p-036', to_id: 'p-004', lot_share: 0.25, blind_flag: false, lambda: 1.0 },
]

// ─── Indexed lookup map ───────────────────────────────────────────────────────

export const PARTICIPANTS_BY_ID: Record<string, Participant> =
  Object.fromEntries(PARTICIPANTS.map(p => [p.id, p]))

export function getParticipant(id: string): Participant | null {
  return PARTICIPANTS_BY_ID[id] ?? null
}

// ─── Counterparty graph view (для визуализации цепочки на профиле) ─────────────
// upstream   = участник закупает у этого контрагента (источник качества)
// downstream = этот контрагент закупает у участника (его покупатель)
export interface CounterpartyView {
  id: string
  display_name: string
  role_code: RoleCode
  lot_share: number
  blind_flag: boolean
  lambda: number
  direction: 'upstream' | 'downstream'
}

export function getCounterparties(slug: string): CounterpartyView[] {
  const out: CounterpartyView[] = []
  for (const l of COUNTERPARTY_LINKS) {
    const isFrom = l.from_id === slug
    const isTo = l.to_id === slug
    if (!isFrom && !isTo) continue
    const cp = PARTICIPANTS_BY_ID[isFrom ? l.to_id : l.from_id]
    if (!cp) continue
    out.push({
      id: cp.id,
      display_name: cp.display_name,
      role_code: cp.role_code,
      lot_share: l.lot_share,
      blind_flag: l.blind_flag,
      lambda: l.lambda,
      direction: isFrom ? 'upstream' : 'downstream',
    })
  }
  return out
}
