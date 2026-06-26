/* -----------------------------------------------------------------------
   Claim — types + mock API
   Схема: ClaimRequest / ClaimStatus из openapi
   ----------------------------------------------------------------------- */

export type RequestedLevel = 'L1' | 'L2' | 'L3'

export interface ClaimRequest {
  /** Идентификатор участника (необязателен на шаге 1 — находим/создаём) */
  participant_id?: string
  contact: string
  requested_level: RequestedLevel
}

export type ClaimStatus = 'pending_verification' | 'provisional' | 'rejected'

export interface ClaimResponse {
  claim_id: string
  status: ClaimStatus
  participant_id: string
  requested_level: RequestedLevel
  contact: string
  submitted_at: string
  /** Примерная дата перехода в provisional */
  estimated_provisional_at?: string
  /** Причина отклонения — только при status=rejected */
  rejection_reason?: string
  request_id: string
}

/* -----------------------------------------------------------------------
   Validation helpers
   ----------------------------------------------------------------------- */
export interface FieldError {
  contact?: string
  requested_level?: string
  query?: string
}

export function validateClaimRequest(
  contact: string,
  level: RequestedLevel | '',
): FieldError {
  const errors: FieldError = {}
  if (!contact.trim()) {
    errors.contact = 'Укажите контактный e-mail или домен'
  } else if (
    !contact.includes('@') &&
    !/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(contact.trim())
  ) {
    errors.contact = 'Введите корректный e-mail или домен (например, company.io)'
  }
  if (!level) {
    errors.requested_level = 'Выберите запрашиваемый уровень KYB/KYC'
  }
  return errors
}

export function validateSearchQuery(query: string): FieldError {
  const errors: FieldError = {}
  if (!query.trim()) {
    errors.query = 'Введите название компании, домен или ID участника'
  } else if (query.trim().length < 2) {
    errors.query = 'Минимум 2 символа для поиска'
  }
  return errors
}

/* -----------------------------------------------------------------------
   Mock search results (шаг 1)
   ----------------------------------------------------------------------- */
export interface SearchResult {
  id: string
  display_name: string
  role_code: string
  jurisdiction: string
  status: 'active' | 'provisional' | 'watch'
}

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  { id: 'p-001', display_name: 'Meridian Capital AG', role_code: 'FUND_MANAGER', jurisdiction: 'CH', status: 'active' },
  { id: 'p-003', display_name: 'Solaris Bioventures Ltd', role_code: 'VC_FUND', jurisdiction: 'UK', status: 'active' },
  { id: 'p-007', display_name: 'Nakamura Securities', role_code: 'BROKER_DEALER', jurisdiction: 'JP', status: 'active' },
  { id: 'p-new', display_name: 'Создать новый профиль', role_code: '—', jurisdiction: '—', status: 'provisional' },
]

export async function mockSearch(query: string): Promise<SearchResult[]> {
  await new Promise(r => setTimeout(r, 600))
  if (!query.trim()) return []
  return MOCK_SEARCH_RESULTS.filter(r =>
    r.display_name.toLowerCase().includes(query.toLowerCase()) ||
    r.id.includes(query.toLowerCase()),
  )
}

/* -----------------------------------------------------------------------
   KYB types and mock submit — POST /claims/kyb
   ----------------------------------------------------------------------- */
export type Jurisdiction = 'RU' | 'KZ' | 'BY' | 'OTHER'

export interface KybRequest {
  participant_id?: string
  legal_name: string
  jurisdiction: Jurisdiction | ''
  requested_level: RequestedLevel | ''
  /** File names attached (mock — real upload not implemented) */
  documents: string[]
}

export interface KybFieldError {
  legal_name?: string
  jurisdiction?: string
  requested_level?: string
  documents?: string
}

export function validateKybRequest(req: KybRequest): KybFieldError {
  const errors: KybFieldError = {}
  if (!req.legal_name.trim()) errors.legal_name = 'Введите наименование юридического лица'
  if (!req.jurisdiction) errors.jurisdiction = 'Выберите юрисдикцию'
  if (!req.requested_level) errors.requested_level = 'Выберите уровень KYB'
  return errors
}

/** Result shape returned by the KYB provider abstraction (POST /api/kyb/verify). */
interface KybVerifyResult {
  status: 'verified' | 'pending' | 'rejected'
  grantedLevel: 'L0' | 'L1' | 'L2' | 'L3'
  providerRef: string
  estimatedProvisionalAt?: string
  rejectionReason?: string
}

function statusFromKyb(s: KybVerifyResult['status']): ClaimStatus {
  if (s === 'verified') return 'provisional'
  if (s === 'rejected') return 'rejected'
  return 'pending_verification'
}

export async function mockKybSubmit(req: KybRequest): Promise<ClaimResponse> {
  const res = await fetch('/api/kyb/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      legalName: req.legal_name,
      jurisdiction: req.jurisdiction,
      requestedLevel: req.requested_level,
      participantId: req.participant_id,
      documents: req.documents,
    }),
  })
  if (!res.ok) throw new Error('KYB verification failed')
  const { result } = (await res.json()) as { result: KybVerifyResult }

  return {
    claim_id: result.providerRef,
    status: statusFromKyb(result.status),
    participant_id: req.participant_id ?? 'p-new',
    requested_level: req.requested_level as RequestedLevel,
    contact: req.legal_name,
    submitted_at: new Date().toISOString(),
    estimated_provisional_at:
      result.estimatedProvisionalAt ??
      (result.status === 'verified' ? new Date().toISOString() : undefined),
    rejection_reason: result.rejectionReason,
    request_id: 'req_' + Math.random().toString(36).slice(2, 10),
  }
}

/* -----------------------------------------------------------------------
   Mock submit — POST /claims
   ----------------------------------------------------------------------- */
export async function mockSubmitClaim(req: ClaimRequest): Promise<ClaimResponse> {
  // Preserve the demo rejection path for L3 with an invalid contact.
  if (req.requested_level === 'L3' && req.contact.endsWith('@test.invalid')) {
    return {
      claim_id: 'clm_rejected_001',
      status: 'rejected',
      participant_id: req.participant_id ?? 'p-new',
      requested_level: req.requested_level,
      contact: req.contact,
      submitted_at: new Date().toISOString(),
      rejection_reason: 'Контакт не найден в реестре юридических лиц данной юрисдикции.',
      request_id: 'req_' + Math.random().toString(36).slice(2, 10),
    }
  }

  const res = await fetch('/api/kyb/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      legalName: req.contact,
      jurisdiction: '',
      requestedLevel: req.requested_level,
      participantId: req.participant_id,
      contact: req.contact,
    }),
  })
  if (!res.ok) throw new Error('Claim submission failed')
  const { result } = (await res.json()) as { result: KybVerifyResult }

  return {
    claim_id: result.providerRef,
    status: statusFromKyb(result.status),
    participant_id: req.participant_id ?? 'p-new',
    requested_level: req.requested_level,
    contact: req.contact,
    submitted_at: new Date().toISOString(),
    estimated_provisional_at:
      result.estimatedProvisionalAt ??
      (result.status === 'verified' ? new Date().toISOString() : undefined),
    request_id: 'req_' + Math.random().toString(36).slice(2, 10),
  }
}
