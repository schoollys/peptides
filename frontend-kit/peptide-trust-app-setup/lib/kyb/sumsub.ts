import { createHmac, timingSafeEqual } from 'node:crypto'
import type { KybLevel, KybStatus } from './provider'

/* -----------------------------------------------------------------------
   Sumsub KYB API client.

   Pure fetch + node-crypto implementation (no 'server-only' here, so CLI
   scripts — e.g. scripts/sumsub-selftest.ts — can import it). App code reaches
   it through lib/kyb/provider.ts (SumsubKybProvider).

   Server-to-server auth uses App Token request signing (ADR-007: raw KYB data
   stays at the provider, the registry only stores status + opaque refs):
     X-App-Token       = SUMSUB_APP_TOKEN
     X-App-Access-Ts   = unix seconds
     X-App-Access-Sig  = HMAC_SHA256(secret, ts + METHOD + path?query + body)

   Verification is asynchronous: createApplicant() opens a case, the applicant
   completes it via the WebSDK (access token), and the final decision arrives on
   the applicantReviewed webhook (GREEN/RED). See app/api/kyb/sumsub/webhook.

   Docs: https://docs.sumsub.com/reference/authentication
   ----------------------------------------------------------------------- */

export interface SumsubConfig {
  appToken: string
  secretKey: string
  baseUrl: string
  /** KYB verification level name configured in the Sumsub dashboard. */
  levelName: string
  /** Separate secret used to sign inbound webhooks (set in Sumsub → Webhooks). */
  webhookSecret?: string
}

/** Reads + validates the Sumsub config from env. Throws if a secret is missing. */
export function getSumsubConfig(): SumsubConfig {
  const appToken = process.env.SUMSUB_APP_TOKEN
  const secretKey = process.env.SUMSUB_SECRET_KEY
  if (!appToken || !secretKey) {
    throw new Error('Sumsub: SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY are required.')
  }
  return {
    appToken,
    secretKey,
    baseUrl: (process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com').replace(/\/+$/, ''),
    levelName: process.env.SUMSUB_LEVEL_NAME || 'basic-kyb-level',
    webhookSecret: process.env.SUMSUB_WEBHOOK_SECRET || undefined,
  }
}

/**
 * App Token signature. The signed string is ts + METHOD + path(+query) + body,
 * where path is the request URI without the host (must start with "/").
 */
function signRequest(secretKey: string, ts: number, method: string, path: string, body: string): string {
  return createHmac('sha256', secretKey)
    .update(ts + method.toUpperCase() + path + body)
    .digest('hex')
}

/** Performs a signed Sumsub API request and returns the parsed JSON (or throws). */
async function signedFetch<T>(
  cfg: SumsubConfig,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const ts = Math.floor(Date.now() / 1000)
  const payload = body === undefined ? '' : JSON.stringify(body)
  const sig = signRequest(cfg.secretKey, ts, method, path, payload)

  const headers: Record<string, string> = {
    'X-App-Token': cfg.appToken,
    'X-App-Access-Sig': sig,
    'X-App-Access-Ts': String(ts),
    Accept: 'application/json',
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: payload } : {}),
    cache: 'no-store',
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Sumsub ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }
  return (text ? JSON.parse(text) : {}) as T
}

export interface SumsubCompanyInfo {
  companyName?: string
  registrationNumber?: string
  /** ISO 3166-1 alpha-3 country code (e.g. "GBR"). */
  country?: string
}

export interface CreateApplicantParams {
  externalUserId: string
  levelName?: string
  company?: SumsubCompanyInfo
  email?: string
}

export interface SumsubApplicant {
  id: string
  externalUserId: string
  [key: string]: unknown
}

/**
 * Opens a KYB case. `type: 'company'` selects the business flow; companyInfo is
 * best-effort (the WebSDK collects whatever the level still requires).
 */
export async function createApplicant(
  cfg: SumsubConfig,
  params: CreateApplicantParams,
): Promise<SumsubApplicant> {
  const levelName = params.levelName || cfg.levelName
  const path = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`
  const companyInfo = params.company
    ? Object.fromEntries(
        Object.entries({
          companyName: params.company.companyName,
          registrationNumber: params.company.registrationNumber,
          country: params.company.country,
        }).filter(([, v]) => v != null && v !== ''),
      )
    : undefined

  const body: Record<string, unknown> = {
    externalUserId: params.externalUserId,
    type: 'company',
  }
  if (params.email) body.email = params.email
  if (companyInfo && Object.keys(companyInfo).length > 0) {
    body.fixedInfo = { companyInfo }
  }

  return signedFetch<SumsubApplicant>(cfg, 'POST', path, body)
}

export interface AccessTokenParams {
  externalUserId: string
  levelName?: string
  ttlInSecs?: number
}

export interface AccessTokenResponse {
  token: string
  userId: string
}

/** Mints a short-lived WebSDK/MobileSDK access token for the applicant. */
export async function createAccessToken(
  cfg: SumsubConfig,
  params: AccessTokenParams,
): Promise<AccessTokenResponse> {
  return signedFetch<AccessTokenResponse>(cfg, 'POST', '/resources/accessTokens/sdk', {
    userId: params.externalUserId,
    levelName: params.levelName || cfg.levelName,
    ttlInSecs: params.ttlInSecs ?? 600,
  })
}

export interface ApplicantReviewStatus {
  reviewStatus?: string
  reviewResult?: {
    reviewAnswer?: 'GREEN' | 'RED'
    reviewRejectType?: 'FINAL' | 'RETRY'
    rejectLabels?: string[]
  }
}

/** Fetches the current review status of an applicant (polling fallback). */
export async function getApplicantStatus(
  cfg: SumsubConfig,
  applicantId: string,
): Promise<ApplicantReviewStatus> {
  return signedFetch<ApplicantReviewStatus>(
    cfg,
    'GET',
    `/resources/applicants/${encodeURIComponent(applicantId)}/status`,
  )
}

/** Maps a Sumsub reviewAnswer to our KybStatus vocabulary. */
export function mapReviewAnswer(
  reviewAnswer: string | undefined,
  reviewRejectType?: string,
): KybStatus {
  if (reviewAnswer === 'GREEN') return 'verified'
  if (reviewAnswer === 'RED') {
    // RETRY means the applicant may resubmit → still effectively pending for us.
    return reviewRejectType === 'RETRY' ? 'pending' : 'rejected'
  }
  return 'pending'
}

const HMAC_ALGOS: Record<string, string> = {
  HMAC_SHA1_HEX: 'sha1',
  HMAC_SHA256_HEX: 'sha256',
  HMAC_SHA512_HEX: 'sha512',
}

/**
 * Verifies an inbound webhook against the configured webhook secret. Sumsub
 * sends the digest in `x-payload-digest` and the algorithm in
 * `x-payload-digest-alg` (defaults to HMAC_SHA256_HEX). Constant-time compare.
 */
export function verifyWebhookSignature(
  rawBody: string,
  digestHeader: string | null,
  algHeader: string | null,
  webhookSecret: string,
): boolean {
  if (!digestHeader) return false
  const algo = HMAC_ALGOS[algHeader || 'HMAC_SHA256_HEX']
  if (!algo) return false
  const expected = createHmac(algo, webhookSecret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(digestHeader, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export interface SumsubWebhookPayload {
  type?: string
  applicantId?: string
  externalUserId?: string
  levelName?: string
  reviewStatus?: string
  reviewResult?: {
    reviewAnswer?: 'GREEN' | 'RED'
    reviewRejectType?: 'FINAL' | 'RETRY'
    rejectLabels?: string[]
  }
  [key: string]: unknown
}

/**
 * Optional fixed mapping from a Sumsub level name to the trust level granted on
 * approval, via SUMSUB_LEVEL_MAP (e.g. "basic-kyb-level:L2,enhanced-kyb:L3").
 * The webhook handler prefers the claim's requested level; this is a fallback.
 */
export function levelNameToKybLevel(levelName: string | undefined, fallback: KybLevel = 'L2'): KybLevel {
  const raw = process.env.SUMSUB_LEVEL_MAP
  if (raw && levelName) {
    for (const pair of raw.split(',')) {
      const [name, level] = pair.split(':').map(s => s.trim())
      if (name === levelName && /^L[0-3]$/.test(level)) return level as KybLevel
    }
  }
  return fallback
}
