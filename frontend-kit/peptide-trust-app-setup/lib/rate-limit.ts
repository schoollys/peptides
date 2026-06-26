/**
 * Fixed-window rate limiter.
 *
 * Two backends, selected at runtime:
 *  - Upstash Redis (shared across instances) when UPSTASH_REDIS_REST_URL +
 *    UPSTASH_REDIS_REST_TOKEN are set — use `rateLimitAsync()`.
 *  - In-memory (best-effort, per-instance) otherwise, or as a fail-open
 *    fallback if Redis is unreachable.
 *
 * Sensitive endpoints should call `rateLimitAsync()`. The sync `rateLimit()` is
 * kept for callers that cannot await and for the in-memory fallback path.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count++
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

/**
 * Shared-store rate limit via Upstash Redis REST (atomic INCR + EXPIRE NX).
 * Returns null when Redis is not configured or the request fails, so the caller
 * can fall open to the in-memory limiter. Never throws.
 */
async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // INCR creates+increments; EXPIRE NX sets TTL only on the first hit of the
      // window; PTTL reports remaining time for Retry-After.
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds, 'NX'],
        ['PTTL', key],
      ]),
      cache: 'no-store',
    })
    if (!res.ok) return null

    const data = (await res.json()) as { result?: unknown; error?: string }[]
    if (!Array.isArray(data) || data.some((d) => d?.error)) return null

    const count = Number(data[0]?.result ?? 0)
    const pttl = Number(data[2]?.result ?? windowMs)
    const retryAfterSeconds = Math.max(1, Math.ceil((pttl > 0 ? pttl : windowMs) / 1000))

    if (count > limit) {
      return { ok: false, remaining: 0, retryAfterSeconds }
    }
    return { ok: true, remaining: Math.max(0, limit - count), retryAfterSeconds: 0 }
  } catch {
    return null
  }
}

/**
 * Rate limit using the shared store when available, falling back to in-memory.
 * Fail-open: any Redis error degrades to the local limiter rather than blocking.
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const shared = await redisRateLimit(key, limit, windowMs)
  const result = shared ?? rateLimit(key, limit, windowMs)
  if (!result.ok) noteBlocked(key.split(':')[0] ?? 'unknown')
  return result
}

// ── 429 spike alerting ────────────────────────────────────────────────────────
// Count blocked requests per scope in a rolling window; emit one alert per window
// once the count crosses the threshold, so an attack/misconfig surfaces in Sentry.
const SPIKE_WINDOW_MS = 60_000
const SPIKE_THRESHOLD = 30
const spikes = new Map<string, { count: number; windowStart: number; alerted: boolean }>()

function noteBlocked(scope: string): void {
  const now = Date.now()
  const s = spikes.get(scope)
  if (!s || now - s.windowStart >= SPIKE_WINDOW_MS) {
    spikes.set(scope, { count: 1, windowStart: now, alerted: false })
    return
  }
  s.count++
  if (!s.alerted && s.count >= SPIKE_THRESHOLD) {
    s.alerted = true
    void import('./observability')
      .then(({ captureMessage }) =>
        captureMessage(`Rate-limit spike on "${scope}"`, {
          level: 'warning',
          tags: { kind: 'rate_limit_spike', scope, window_ms: String(SPIKE_WINDOW_MS) },
        }),
      )
      .catch(() => {})
  }
}

/** Derive a best-effort client identifier from a request. */
export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get('x-forwarded-for') ?? ''
  const ip = fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return `${scope}:${ip}`
}

// Opportunistic cleanup so the map can't grow unbounded.
const MAX_BUCKETS = 10_000
export function maybeSweep(): void {
  if (buckets.size < MAX_BUCKETS) return
  const now = Date.now()
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}
