// SubmissionRequest / SubmissionResponse mock data + types
// mirrors the openapi schema

export type SubmissionKind = 'review' | 'test' | 'coa' | 'artifact'

export type FactorCode =
  | 'QEF' | 'PCF' | 'SCIF' | 'TRF' | 'FRF' | 'CCF' | 'CVF' | 'CVF_B' | 'RF'

export interface SubmissionRequest {
  participant_id: string
  kind:           SubmissionKind
  lot_qr_key?:   string
  factor:         FactorCode
  value:          number          // 0–100
  signed_payload?: string         // X-Signature mock
  media_ref?:     string          // uploaded file reference
}

export interface SubmissionResponse {
  submission_id: string
  status:        'queued'
  queued_at:     string
  estimated_recalc: string
  request_id:    string
}

export interface SubmissionError422 {
  code:    string
  message: string
  field?:  string
  hint?:   string
}

export interface FieldErrors {
  participant_id?: string
  kind?:           string
  factor?:         string
  value?:          string
  lot_qr_key?:     string
  file?:           string
}

// ---------- factor metadata ----------
export const FACTOR_META: Record<FactorCode, { label: string; description: string }> = {
  QEF:   { label: 'QEF — Качество данных',        description: 'Quality Evidence Factor' },
  PCF:   { label: 'PCF — Процессный контроль',    description: 'Process Control Factor' },
  SCIF:  { label: 'SCIF — Цепочка хранения',      description: 'Supply Chain Integrity Factor' },
  TRF:   { label: 'TRF — Прозрачность',           description: 'Transparency & Reporting Factor' },
  FRF:   { label: 'FRF — Нормативное соответствие', description: 'Regulatory Framework Factor' },
  CCF:   { label: 'CCF — Клинические данные',     description: 'Clinical Claim Factor' },
  CVF:   { label: 'CVF — Проверяемость',          description: 'Claim Verifiability Factor' },
  CVF_B: { label: 'CVF_B — Блокчейн-верификация', description: 'CVF Blockchain variant' },
  RF:    { label: 'RF — Репутация',               description: 'Reputation Factor' },
}

export const KIND_META: Record<SubmissionKind, { label: string; description: string; needsCoa: boolean }> = {
  review:   { label: 'review — Независимое ревью',    description: 'Внешний аудит или рецензия', needsCoa: false },
  test:     { label: 'test — Лабораторный тест',      description: 'Верифицированный тест-протокол', needsCoa: true },
  coa:      { label: 'coa — Сертификат анализа',      description: 'CoA от аккредитованной лаборатории', needsCoa: true },
  artifact: { label: 'artifact — Произвольный файл', description: 'Любой подтверждающий артефакт', needsCoa: false },
}

// --------- business rule hints ----------
// These are shown inline as the user fills the form
export function getCustodyHint(kind: SubmissionKind, hasFile: boolean): string | null {
  if ((kind === 'coa' || kind === 'test') && !hasFile) {
    return 'Vᵢ будет < 1.0 — неполная custody без подписанного файла'
  }
  return null
}

// ---------- validation ----------
export function validateSubmission(
  req: Partial<SubmissionRequest>,
  hasFile: boolean,
): FieldErrors {
  const errs: FieldErrors = {}

  if (!req.participant_id?.trim()) {
    errs.participant_id = 'Укажите ID или домен участника'
  }
  if (!req.kind) {
    errs.kind = 'Выберите тип данных'
  }
  if (!req.factor) {
    errs.factor = 'Выберите фактор'
  }
  if (req.value === undefined || req.value === null || String(req.value) === '') {
    errs.value = 'Введите значение'
  } else if (req.value < 0 || req.value > 100) {
    errs.value = 'Значение должно быть в диапазоне 0–100'
  } else if (!Number.isFinite(req.value)) {
    errs.value = 'Введите числовое значение'
  }

  return errs
}

// ---------- mock submit ----------
// Simulates known 422 business-rule errors based on inputs
const REJECTED_PARTICIPANTS = ['test-rejected', 'bad-actor']
const DUPLICATE_ARTIFACTS   = ['LOT-2024-DUPE', 'DUP-001']

export async function mockSubmitData(
  req: SubmissionRequest,
): Promise<{ ok: true; data: SubmissionResponse } | { ok: false; error: SubmissionError422 }> {
  await new Promise(r => setTimeout(r, 1400))

  // 422: unaccredited oracle
  if (REJECTED_PARTICIPANTS.includes(req.participant_id.toLowerCase())) {
    return {
      ok: false,
      error: {
        code:    'UNACCREDITED_ORACLE',
        message: 'Участник не аккредитован как источник данных для этого фактора.',
        field:   'participant_id',
        hint:    'Пройдите KYB L2 и подайте заявку на аккредитацию оракула.',
      },
    }
  }

  // 422: duplicate artifact
  if (req.lot_qr_key && DUPLICATE_ARTIFACTS.includes(req.lot_qr_key.toUpperCase())) {
    return {
      ok: false,
      error: {
        code:    'DUPLICATE_ARTIFACT',
        message: 'Артефакт с этим Lot-QR ключом уже зарегистрирован в системе.',
        field:   'lot_qr_key',
        hint:    'Каждый артефакт может быть использован только однократно.',
      },
    }
  }

  // success
  return {
    ok: true,
    data: {
      submission_id:     'sub-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      status:            'queued',
      queued_at:         new Date().toISOString(),
      estimated_recalc:  new Date(Date.now() + 5 * 60_000).toISOString(),
      request_id:        'req-' + Math.random().toString(36).slice(2, 12),
    },
  }
}
