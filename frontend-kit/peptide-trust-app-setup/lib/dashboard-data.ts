// Dashboard — mock data for "my profile" and counterparty alerts

import type { Tier, DominantFactor, RoleCode } from './catalog-data'
import type { KybLevel, FlagSeverity } from './profile-data'

// ─── My profile summary (the logged-in participant) ────────────────────────
export interface MyProfile {
  id: string
  display_name: string
  role_code: RoleCode
  jurisdiction: string
  score: number
  score_prev: number          // previous period for trend
  tier: Tier
  dominant_factor: DominantFactor
  is_balanced: boolean
  kyb_level: KybLevel
  verified_legal: boolean
  trust_ceiling: number
  algo_version: string
  updated_days_ago: number
  incomplete_fields: IncompleteField[]
}

export interface IncompleteField {
  key: string
  label: string
}

// ─── Counterparty alert ────────────────────────────────────────────────────
export type AlertAction = 'review_sourcing' | 'confirm_sourcing' | 'open_appeal'

export interface CounterpartyAlert {
  id: string
  counterparty_id: string
  counterparty_name: string
  counterparty_tier: Tier
  severity: FlagSeverity
  title: string
  detail: string
  score_delta: number          // e.g. -18.4 (negative = dropped)
  score_current: number
  raised_at: string            // ISO
  status: 'UNREAD' | 'READ' | 'ACTIONED'
  suggested_actions: AlertAction[]
}

// ─── Mock "my profile" ─────────────────────────────────────────────────────
export const MY_PROFILE: MyProfile = {
  id: 'p-003',
  display_name: 'PeptideSource International',
  role_code: 'DISTRIBUTOR',
  jurisdiction: 'США (US)',
  score: 82.4,
  score_prev: 80.1,
  tier: 'Gold',
  dominant_factor: 'QEF',
  is_balanced: false,
  kyb_level: 'L2',
  verified_legal: true,
  trust_ceiling: 90,
  algo_version: 'v2.4.1',
  updated_days_ago: 5,
  incomplete_fields: [
    { key: 'ubo_declaration', label: 'Декларация UBO' },
    { key: 'chain_wallet',    label: 'Onchain-кошелёк' },
    { key: 'coa_q3',         label: 'COA за Q3 2026' },
  ],
}

// ─── Mock counterparty alerts ──────────────────────────────────────────────
export const COUNTERPARTY_ALERTS: CounterpartyAlert[] = [
  {
    id: 'ca-001',
    counterparty_id: 'p-012',
    counterparty_name: 'PharmaGate RU',
    counterparty_tier: 'Watch',
    severity: 'CRITICAL',
    title: 'Критическое падение Trust Score',
    detail: 'Trust Score снизился с 56.6 до 38.2 (−18.4) за 90 дней. Флаги: SCORE_DECLINE (CRITICAL), TEST_DISCREPANCY (WARNING).',
    score_delta: -18.4,
    score_current: 38.2,
    raised_at: '2026-06-18T09:00:00Z',
    status: 'UNREAD',
    suggested_actions: ['review_sourcing', 'open_appeal'],
  },
  {
    id: 'ca-002',
    counterparty_id: 'p-005',
    counterparty_name: 'Quantum Peptides LLC',
    counterparty_tier: 'Silver',
    severity: 'WARNING',
    title: 'Неполный KYB — ограниченный Trust Ceiling',
    detail: 'KYB на уровне L1. Trust Ceiling ограничен 80 пунктами до завершения верификации юридического лица.',
    score_delta: -2.1,
    score_current: 71.3,
    raised_at: '2026-06-12T14:30:00Z',
    status: 'READ',
    suggested_actions: ['confirm_sourcing'],
  },
  {
    id: 'ca-003',
    counterparty_id: 'p-010',
    counterparty_name: 'ProPeptide Ventures',
    counterparty_tier: 'Bronze',
    severity: 'INFO',
    title: 'Новый Provisional-участник',
    detail: 'ProPeptide Ventures получил статус Provisional. Score будет рассчитан после накопления минимум 5 тестов.',
    score_delta: 0,
    score_current: 0,
    raised_at: '2026-06-10T11:00:00Z',
    status: 'READ',
    suggested_actions: ['confirm_sourcing'],
  },
]

// ─── Labels ────────────────────────────────────────────────────────────────
export const ACTION_LABELS: Record<AlertAction, string> = {
  review_sourcing: 'Пересмотреть сорсинг',
  confirm_sourcing: 'Подтвердить сорсинг',
  open_appeal:     'Открыть апелляцию',
}

export const SEVERITY_CONFIG: Record<
  FlagSeverity,
  { dot: string; bg: string; border: string; text: string; label: string }
> = {
  CRITICAL: {
    dot:    '#d8351e',
    bg:     'rgba(216,53,30,.07)',
    border: 'rgba(216,53,30,.22)',
    text:   '#b02010',
    label:  'Критический',
  },
  WARNING: {
    dot:    '#c9a227',
    bg:     'rgba(201,162,39,.07)',
    border: 'rgba(201,162,39,.25)',
    text:   '#7a6000',
    label:  'Предупреждение',
  },
  INFO: {
    dot:    '#533afd',
    bg:     'rgba(83,58,253,.05)',
    border: 'rgba(83,58,253,.18)',
    text:   '#2e2b8c',
    label:  'Инфо',
  },
}

// ─── Simulate fetch ────────────────────────────────────────────────────────
export async function fetchDashboard(): Promise<{
  profile: MyProfile
  alerts: CounterpartyAlert[]
}> {
  await new Promise(r => setTimeout(r, 640))
  return { profile: MY_PROFILE, alerts: COUNTERPARTY_ALERTS }
}
