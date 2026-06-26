import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'pt_session'

/**
 * Gate the authenticated areas with full cryptographic verification at the edge.
 *
 * The session token is `base64url(payload).hmacSha256(base64url(payload))`,
 * matching lib/auth/session.ts. node:crypto is unavailable in the edge runtime,
 * so we verify with Web Crypto (crypto.subtle). A request with a missing,
 * malformed, tampered, or expired token is redirected to /login.
 *
 * (Next.js 16 renamed the `middleware` convention to `proxy`.)
 */

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'
}

function b64urlToBytes(s: string): Uint8Array {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = norm.length % 4 ? 4 - (norm.length % 4) : 0
  const bin = atob(norm + '='.repeat(pad))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot < 0) return false
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
    if (!safeEqual(bytesToB64url(new Uint8Array(mac)), sig)) return false

    const json = new TextDecoder().decode(b64urlToBytes(body))
    const payload = JSON.parse(json) as { exp?: number }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}

/** Paths that require an authenticated session. */
const GATED_PREFIXES = ['/dashboard', '/submit']

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/**
 * Build a per-request Content-Security-Policy.
 *
 * - script-src: 'self' (Next chunks, same-origin analytics) + a per-request
 *   nonce that Next applies to its inline bootstrap scripts. 'unsafe-eval' is
 *   added in dev only (React Refresh / webpack HMR need it).
 * - style-src: 'unsafe-inline' is required — the UI uses inline `style`
 *   attributes pervasively and next/font injects inline styles. Tightening this
 *   would need a broad refactor (tracked separately).
 */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production'
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  // Auth gate for protected areas (full crypto verification at the edge).
  const path = request.nextUrl.pathname
  const isGated = GATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
  if (isGated) {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (!(await isValidSession(token))) {
      const url = request.nextUrl.clone()
      const next = url.pathname + url.search
      url.pathname = '/login'
      url.search = `?next=${encodeURIComponent(next)}`
      const redirect = NextResponse.redirect(url)
      if (token) redirect.cookies.delete(SESSION_COOKIE)
      return redirect
    }
  }

  // Attach a per-request CSP nonce. Setting it on the request headers lets Next
  // apply the nonce to its inline scripts; we also send the CSP on the response
  // so the browser enforces it. The nonce is exposed via `x-nonce` for any of
  // our own scripts that need it (read in app/layout.tsx).
  const nonce = generateNonce()
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('content-security-policy', csp)
  return response
}

export const config = {
  // Run on all page routes so CSP is applied everywhere, excluding API routes,
  // Next internals, the cross-origin badge, and static files (those with a dot).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|badge|.*\\.).*)'],
}
