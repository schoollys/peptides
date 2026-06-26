/**
 * Dependency-free error reporting.
 *
 * When SENTRY_DSN is set, exceptions are sent to Sentry via its public envelope
 * endpoint (no SDK needed — keeps the dependency surface small and avoids peer
 * conflicts). Without a DSN it degrades to console.error, so dev and CI are
 * unaffected. Swap in @sentry/nextjs later if richer features are needed.
 */

interface ParsedDsn {
  endpoint: string
  publicKey: string
  dsn: string
}

let parsedDsn: ParsedDsn | null | undefined

function getDsn(): ParsedDsn | null {
  if (parsedDsn !== undefined) return parsedDsn
  const raw = process.env.SENTRY_DSN
  if (!raw) {
    parsedDsn = null
    return null
  }
  try {
    const u = new URL(raw)
    const projectId = u.pathname.replace(/^\/+/, '')
    parsedDsn = {
      endpoint: `${u.protocol}//${u.host}/api/${projectId}/envelope/`,
      publicKey: u.username,
      dsn: raw,
    }
  } catch {
    parsedDsn = null
  }
  return parsedDsn
}

function uuid(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, '')
}

export interface CaptureContext {
  route?: string
  method?: string
  tags?: Record<string, string>
}

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info'

/** Build the request/tags fields shared by exception and message events. */
function eventMeta(context: CaptureContext) {
  return {
    environment: process.env.NODE_ENV ?? 'development',
    ...(context.tags ? { tags: context.tags } : {}),
    ...(context.route || context.method
      ? { request: { url: context.route, method: context.method } }
      : {}),
  }
}

async function sendEnvelope(event: Record<string, unknown>, dsn: ParsedDsn): Promise<void> {
  const header = JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString(), dsn: dsn.dsn })
  const body = `${header}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(event)}\n`
  try {
    await fetch(dsn.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=peptidetrust/1.0`,
      },
      body,
    })
  } catch (sendErr) {
    console.error('[observability] failed to forward event to Sentry:', sendErr)
  }
}

/** Report an exception. No-ops gracefully when SENTRY_DSN is not configured. */
export async function captureException(error: unknown, context: CaptureContext = {}): Promise<void> {
  const dsn = getDsn()
  const err = error instanceof Error ? error : new Error(String(error))

  if (!dsn) {
    console.error('[observability]', context.route ?? '', err)
    return
  }

  await sendEnvelope(
    {
      event_id: uuid(),
      timestamp: Date.now() / 1000,
      platform: 'node',
      level: 'error',
      ...eventMeta(context),
      exception: {
        values: [{ type: err.name, value: err.message, ...(err.stack ? { stacktrace: { frames: [] } } : {}) }],
      },
    },
    dsn,
  )
}

/**
 * Report a structured message/alert (not a thrown exception) — e.g. rate-limit
 * spikes or swallowed DB errors. No-ops to console when SENTRY_DSN is unset.
 */
export async function captureMessage(
  message: string,
  context: CaptureContext & { level?: SeverityLevel } = {},
): Promise<void> {
  const { level = 'warning', ...rest } = context
  const dsn = getDsn()
  if (!dsn) {
    const line = `[observability] ${level}: ${message}${rest.route ? ` (${rest.route})` : ''}`
    if (level === 'error' || level === 'fatal') console.error(line, rest.tags ?? '')
    else console.warn(line, rest.tags ?? '')
    return
  }
  await sendEnvelope(
    {
      event_id: uuid(),
      timestamp: Date.now() / 1000,
      platform: 'node',
      level,
      message,
      ...eventMeta(rest),
    },
    dsn,
  )
}
