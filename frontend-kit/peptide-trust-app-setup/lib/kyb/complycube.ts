import { createHmac, timingSafeEqual } from 'node:crypto'
import type { KybStatus } from './provider'

/* -----------------------------------------------------------------------
   ComplyCube KYB API client.

   Pure fetch + node-crypto implementation (no 'server-only' here, so CLI
   scripts can import it). App code reaches it through lib/kyb/provider.ts
   (ComplyCubeKybProvider).

   Auth is a simple API key in the Authorization header (use a *test* key in
   dev/sandbox, a *live* key in prod). KYB is asynchronous: we create a
   company-type client, open a check, and the final decision arrives on the
   check.completed webhook (payload.outcome). Only opaque ids + the outcome are
   stored here — raw KYB data stays at ComplyCube (ADR-007).

   Docs: https://docs.complycube.com/documentation/api-reference
   ----------------------------------------------------------------------- */

export interface ComplyCubeConfig {
  apiKey: string
  baseUrl: string
  /** Check type opened for KYB (configurable per account plan). */
  checkType: string
  /** Secret from the ComplyCube webhook used to verify inbound signatures. */
  webhookSecret?: string
}

/** Reads + validates the ComplyCube config from env. Throws if the key is missing. */
export function getComplyCubeConfig(): ComplyCubeConfig {
  const apiKey = process.env.COMPLYCUBE_API_KEY
  if (!apiKey) {
    throw new Error('ComplyCube: COMPLYCUBE_API_KEY is required.')
  }
  return {
    apiKey,
    baseUrl: (process.env.COMPLYCUBE_BASE_URL || 'https://api.complycube.com/v1').replace(/\/+$/, ''),
    checkType: process.env.COMPLYCUBE_CHECK_TYPE || 'extensive_screening_check',
    webhookSecret: process.env.COMPLYCUBE_WEBHOOK_SECRET || undefined,
  }
}

/** Performs a ComplyCube API request and returns the parsed JSON (or throws). */
async function apiFetch<T>(
  cfg: ComplyCubeConfig,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: cfg.apiKey,
    Accept: 'application/json',
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`ComplyCube ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }
  return (text ? JSON.parse(text) : {}) as T
}

export interface CompanyDetails {
  name: string
  /** Company registration number, when known. */
  registrationNumber?: string
  /** ISO 3166-1 alpha-2 country of incorporation (e.g. "GB"). */
  incorporationCountry?: string
  website?: string
}

export interface CreateClientParams {
  email: string
  company: CompanyDetails
  /** Your own id for the client — correlates inbound webhooks. */
  externalId?: string
}

export interface ComplyCubeClient {
  id: string
  type: string
  [key: string]: unknown
}

/** Creates a company-type client (the KYB subject). Returns the ComplyCube client id. */
export async function createCompanyClient(
  cfg: ComplyCubeConfig,
  params: CreateClientParams,
): Promise<ComplyCubeClient> {
  const companyDetails = Object.fromEntries(
    Object.entries({
      name: params.company.name,
      registrationNumber: params.company.registrationNumber,
      incorporationCountry: params.company.incorporationCountry,
      website: params.company.website,
    }).filter(([, v]) => v != null && v !== ''),
  )

  const body: Record<string, unknown> = {
    type: 'company',
    email: params.email,
    companyDetails,
  }
  if (params.externalId) body.externalId = params.externalId

  return apiFetch<ComplyCubeClient>(cfg, 'POST', '/clients', body)
}

export interface ComplyCubeCheck {
  id: string
  clientId: string
  type: string
  status?: string
  outcome?: string
  [key: string]: unknown
}

/** Opens a check against a client. Resolves asynchronously via the webhook. */
export async function createCheck(
  cfg: ComplyCubeConfig,
  clientId: string,
  type?: string,
): Promise<ComplyCubeCheck> {
  return apiFetch<ComplyCubeCheck>(cfg, 'POST', '/checks', {
    clientId,
    type: type || cfg.checkType,
  })
}

/** Maps a ComplyCube check outcome to our KybStatus vocabulary. */
export function mapOutcome(outcome: string | undefined): KybStatus {
  switch (outcome) {
    case 'clear':
      return 'verified'
    case 'attention':
      // Manual review required → not a final decision yet.
      return 'pending'
    default:
      // rejected / not_processed / unknown
      return 'rejected'
  }
}

/**
 * Verifies an inbound webhook. ComplyCube signs the raw request body with the
 * webhook secret (HMAC-SHA256, hex) and sends it in the `complycube-signature`
 * header. Constant-time compare.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): boolean {
  if (!signatureHeader) return false
  const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signatureHeader, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export interface ComplyCubeWebhookEvent {
  type?: string
  payload?: {
    id?: string
    clientId?: string
    type?: string
    status?: string
    outcome?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}
