// AppealRequest / Appeal — OpenAPI schema mock
// Statuses: submitted → panel_forming → in_review → decided | withdrawn

import type { Flag } from './profile-data'

export type AppealStatus =
  | 'submitted'
  | 'panel_forming'
  | 'in_review'
  | 'decided'
  | 'withdrawn'

export interface AppealRequest {
  subject_id: string   // participant_id
  flag_id: string
  statement: string
}

export interface Appeal {
  id: string
  subject_id: string
  flag_id: string
  flag_type: string
  statement: string
  status: AppealStatus
  submitted_at: string  // ISO
  request_id: string
  panel_ref?: string    // VRF panel identifier, set when panel_forming
  decision?: string     // binding decision text, set when decided
}

export interface AppealResponse {
  appeal: Appeal
  http_status: 201 | 422
  error?: { code: string; message: string; hint: string }
}

// ─── Mock active flags per participant ─────────────────────────────────────
export const MOCK_ACTIVE_FLAGS: Record<string, Flag[]> = {
  'p-005': [
    {
      id: 'f-1',
      type: 'KYB_INCOMPLETE',
      severity: 'WARNING',
      status: 'OPEN',
      message: 'Уровень KYB L1 — предоставьте юридические документы для повышения до L2',
      raised_at: '2026-05-10T00:00:00Z',
    },
  ],
  'p-010': [
    {
      id: 'f-1',
      type: 'PROVISIONAL_DATA',
      severity: 'WARNING',
      status: 'OPEN',
      message: 'Недостаточно данных для расчёта Trust Score',
      raised_at: '2026-06-16T00:00:00Z',
    },
    {
      id: 'f-2',
      type: 'KYB_MISSING',
      severity: 'CRITICAL',
      status: 'OPEN',
      message: 'KYB-идентификация не завершена — участник не может быть верифицирован',
      raised_at: '2026-06-16T00:00:00Z',
    },
  ],
  'p-012': [
    {
      id: 'f-1',
      type: 'SCORE_DECLINE',
      severity: 'CRITICAL',
      status: 'MONITORING',
      message: 'Trust Score снизился на 18.4 пунктов за последние 90 дней',
      raised_at: '2026-06-01T00:00:00Z',
    },
    {
      id: 'f-2',
      type: 'TEST_DISCREPANCY',
      severity: 'WARNING',
      status: 'OPEN',
      message: 'Обнаружены расхождения в 3 независимых тестах по фактору RF',
      raised_at: '2026-05-20T00:00:00Z',
    },
    {
      id: 'f-3',
      type: 'LEGAL_UNVERIFIED',
      severity: 'INFO',
      status: 'OPEN',
      message: 'Юридическая верификация не пройдена',
      raised_at: '2026-04-10T00:00:00Z',
    },
  ],
  // Default demo flags (used when subject_id is not in mock)
  'demo': [
    {
      id: 'f-demo-1',
      type: 'DATA_STALE',
      severity: 'WARNING',
      status: 'OPEN',
      message: 'Данные по фактору QEF не обновлялись более 60 дней',
      raised_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 'f-demo-2',
      type: 'AUDIT_PENDING',
      severity: 'INFO',
      status: 'OPEN',
      message: 'Аудит цепочки поставок запланирован, результат ожидается',
      raised_at: '2026-04-15T00:00:00Z',
    },
  ],
}

// ─── Human-readable flag type labels ───────────────────────────────────────
const FLAG_TYPE_LABELS: Record<string, string> = {
  KYB_INCOMPLETE:   'Неполный KYB',
  PROVISIONAL_DATA: 'Недостаточно данных',
  KYB_MISSING:      'Отсутствует KYB',
  SCORE_DECLINE:    'Снижение Trust Score',
  TEST_DISCREPANCY: 'Расхождение тестов',
  LEGAL_UNVERIFIED: 'Юридически не верифицирован',
  DATA_STALE:       'Устаревшие данные',
  AUDIT_PENDING:    'Аудит в ожидании',
}

export function getFlagLabel(type: string): string {
  return FLAG_TYPE_LABELS[type] ?? type.replace(/_/g, ' ')
}

// ─── Validation ─────────────────────────────────────────────────────────────
export interface AppealFieldError {
  subject_id?: string
  flag_id?: string
  statement?: string
}

export function validateAppealRequest(req: Partial<AppealRequest>): AppealFieldError {
  const errors: AppealFieldError = {}
  if (!req.subject_id?.trim()) {
    errors.subject_id = 'Укажите ID участника'
  } else if (!/^[a-z0-9_-]+$/i.test(req.subject_id.trim())) {
    errors.subject_id = 'Недопустимые символы в ID участника'
  }
  if (!req.flag_id) {
    errors.flag_id = 'Выберите оспариваемый флаг'
  }
  if (!req.statement?.trim()) {
    errors.statement = 'Заявление не может быть пустым'
  } else if (req.statement.trim().length < 30) {
    errors.statement = `Минимум 30 символов (сейчас ${req.statement.trim().length})`
  } else if (req.statement.trim().length > 4000) {
    errors.statement = 'Максимум 4 000 символов'
  }
  return errors
}

// ─── Mock API ────────────────────────────────────────────────────────────────
let _appealCounter = 1001

export async function mockSubmitAppeal(req: AppealRequest): Promise<AppealResponse> {
  await new Promise(r => setTimeout(r, 1400))

  // Simulate 422 for known-problematic flags
  if (req.flag_id === 'f-demo-1' && req.statement.toLowerCase().includes('reject')) {
    return {
      http_status: 422,
      appeal: null as unknown as Appeal,
      error: {
        code: 'APPEAL_RULE_VIOLATION',
        message: 'Апелляция нарушает правило §4.2: флаг DATA_STALE не может быть оспорен без предоставления актуальных данных',
        hint: 'Приложите свежие данные фактора в поле "Заявление" или загрузите их через /submit перед подачей апелляции.',
      },
    }
  }

  const id = `APL-${++_appealCounter}`
  const flags = MOCK_ACTIVE_FLAGS[req.subject_id] ?? MOCK_ACTIVE_FLAGS['demo']
  const flag = flags.find(f => f.id === req.flag_id)

  return {
    http_status: 201,
    appeal: {
      id,
      subject_id: req.subject_id,
      flag_id: req.flag_id,
      flag_type: flag?.type ?? 'UNKNOWN',
      statement: req.statement,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      request_id: `req_${Math.random().toString(36).slice(2, 10)}`,
      panel_ref: undefined,
      decision: undefined,
    },
  }
}

export function getActiveFlags(subjectId: string): Flag[] {
  return MOCK_ACTIVE_FLAGS[subjectId] ?? MOCK_ACTIVE_FLAGS['demo']
}

// ─── Status tracker steps ───────────────────────────────────────────────────
export const APPEAL_STATUS_STEPS: {
  status: AppealStatus
  label: string
  sublabel: string
}[] = [
  { status: 'submitted',     label: 'Подана',            sublabel: 'Апелляция зарегистрирована' },
  { status: 'panel_forming', label: 'Формирование',      sublabel: 'Панель VRF + conflict-screen' },
  { status: 'in_review',     label: 'На рассмотрении',   sublabel: 'Панель изучает доказательства' },
  { status: 'decided',       label: 'Решение вынесено',  sublabel: 'Binding в реестре' },
]

export const STATUS_ORDER: AppealStatus[] = [
  'submitted', 'panel_forming', 'in_review', 'decided',
]
