/* -----------------------------------------------------------------------
   KYB provider abstraction.

   The MVP ships a MockKybProvider, but the rest of the app only depends on
   the KybProvider interface — so a real vendor (e.g. Sumsub, Veriff, iDenfy)
   can be dropped in behind getKybProvider() without touching call sites.
   ----------------------------------------------------------------------- */

export type KybLevel = 'L0' | 'L1' | 'L2' | 'L3'
export type RequestedLevel = 'L1' | 'L2' | 'L3'
export type KybStatus = 'verified' | 'pending' | 'rejected'

export interface KybInput {
  legalName: string
  jurisdiction: string
  requestedLevel: RequestedLevel
  contact?: string
  participantId?: string
  /** File names attached (real upload handled separately) */
  documents?: string[]
}

export interface KybResult {
  status: KybStatus
  /** Trust level actually granted now (L0 until a higher level is verified) */
  grantedLevel: KybLevel
  /** Opaque reference from the verification provider */
  providerRef: string
  /** ISO date the profile is expected to go provisional, when pending */
  estimatedProvisionalAt?: string
  rejectionReason?: string
}

export interface KybProvider {
  readonly name: string
  verify(input: KybInput): Promise<KybResult>
}

function ref(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`
}

function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Deterministic-enough mock:
 *  - L1: instant self-attestation + domain check → verified, granted L1.
 *  - L2: document review → pending, ~2 business days, granted L0 for now.
 *  - L3: full on-site review → pending, ~5 business days, granted L0 for now.
 */
export class MockKybProvider implements KybProvider {
  readonly name = 'mock'

  async verify(input: KybInput): Promise<KybResult> {
    await new Promise(r => setTimeout(r, 400))

    if (input.requestedLevel === 'L1') {
      return { status: 'verified', grantedLevel: 'L1', providerRef: ref('kyb') }
    }

    const days = input.requestedLevel === 'L2' ? 2 : 5
    return {
      status: 'pending',
      grantedLevel: 'L0',
      providerRef: ref('kyb'),
      estimatedProvisionalAt: inDays(days),
    }
  }
}

/**
 * Generic HTTP KYB vendor skeleton. Works once KYB_API_URL + KYB_API_KEY are set;
 * adjust the request/response mapping to your vendor (Sumsub, Veriff, iDenfy, …).
 * Call sites are unchanged — they only see the KybProvider interface.
 */
export class HttpKybProvider implements KybProvider {
  readonly name = 'http'
  private readonly apiUrl: string
  private readonly apiKey: string

  constructor() {
    const apiUrl = process.env.KYB_API_URL
    const apiKey = process.env.KYB_API_KEY
    if (!apiUrl || !apiKey) {
      throw new Error('HttpKybProvider requires KYB_API_URL and KYB_API_KEY')
    }
    this.apiUrl = apiUrl.replace(/\/+$/, '')
    this.apiKey = apiKey
  }

  async verify(input: KybInput): Promise<KybResult> {
    // TODO(vendor): map this request body to the vendor's API shape.
    const res = await fetch(`${this.apiUrl}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legal_name: input.legalName,
        jurisdiction: input.jurisdiction,
        requested_level: input.requestedLevel,
        contact: input.contact,
        external_id: input.participantId,
        documents: input.documents,
      }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`KYB vendor error ${res.status}: ${detail.slice(0, 200)}`)
    }
    // TODO(vendor): translate the vendor's status/level vocabulary to ours.
    const data = (await res.json().catch(() => ({}))) as {
      status?: KybStatus
      granted_level?: KybLevel
      reference?: string
      estimated_provisional_at?: string
      rejection_reason?: string
    }
    return {
      status: data.status ?? 'pending',
      grantedLevel: data.granted_level ?? 'L0',
      providerRef: data.reference ?? ref('kyb'),
      ...(data.estimated_provisional_at ? { estimatedProvisionalAt: data.estimated_provisional_at } : {}),
      ...(data.rejection_reason ? { rejectionReason: data.rejection_reason } : {}),
    }
  }
}

let cached: KybProvider | undefined

/** Returns the configured KYB provider (mock by default; 'http' for a real vendor). */
export function getKybProvider(): KybProvider {
  if (cached) return cached
  switch (process.env.KYB_PROVIDER) {
    case 'http':
      cached = new HttpKybProvider()
      break
    default:
      cached = new MockKybProvider()
  }
  return cached
}
