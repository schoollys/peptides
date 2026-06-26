import { NextResponse } from 'next/server'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import { reanchorAll } from '@/lib/anchor/reanchor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Scheduled re-anchoring job. Wired via vercel.json `crons`; Vercel sends
 * `Authorization: Bearer $CRON_SECRET` to scheduled invocations. Also accepts
 * an `x-cron-secret` header for manual/other schedulers.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }

  const authorized =
    request.headers.get('authorization') === `Bearer ${secret}` ||
    request.headers.get('x-cron-secret') === secret
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseEnabled()) {
    return NextResponse.json({ error: 'Database is not enabled' }, { status: 503 })
  }

  try {
    const result = await reanchorAll(getSql())
    return NextResponse.json(
      { ok: true, ...result },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[cron/anchor] re-anchoring failed:', err)
    return NextResponse.json({ ok: false, error: 'Re-anchoring failed' }, { status: 500 })
  }
}
