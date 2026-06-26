import { NextResponse } from 'next/server'
import { getSql, isDatabaseEnabled } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Lightweight liveness/readiness probe for uptime monitors and load balancers.
 * Reports app liveness plus database reachability (when DATA_SOURCE=db).
 * Returns 200 when healthy, 503 when the DB is configured but unreachable.
 */
export async function GET() {
  const startedAt = Date.now()
  const dbConfigured = isDatabaseEnabled()

  let db: 'ok' | 'down' | 'disabled' = dbConfigured ? 'down' : 'disabled'
  if (dbConfigured) {
    try {
      await getSql()`SELECT 1`
      db = 'ok'
    } catch {
      db = 'down'
    }
  }

  const healthy = db !== 'down'
  const body = {
    status: healthy ? 'ok' : 'degraded',
    db,
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - startedAt,
    time: new Date().toISOString(),
  }

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
