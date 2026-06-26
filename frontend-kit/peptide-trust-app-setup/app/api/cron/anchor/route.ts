import { NextResponse } from 'next/server'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import { reanchorAll } from '@/lib/anchor/reanchor'
import { getAnchorProvider } from '@/lib/anchor/provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// OTS stamping/upgrading makes a network round-trip per hash; give the batch
// room to run within the platform's function budget.
export const maxDuration = 60

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
    const sql = getSql()
    // Deterministic backfill: ensures every score/flag has a current anchor_hash.
    const result = await reanchorAll(sql)

    // Real on-chain step: stamp pending hashes and upgrade confirmed ones.
    // Loaded lazily so the heavy OpenTimestamps dependency is only pulled in
    // when this provider is actually configured.
    let ots: Awaited<ReturnType<typeof import('@/lib/anchor/ots-pipeline').runOtsPipeline>> | undefined
    if (getAnchorProvider().name === 'ots') {
      const { runOtsPipeline } = await import('@/lib/anchor/ots-pipeline')
      ots = await runOtsPipeline(sql)
    }

    return NextResponse.json(
      { ok: true, ...result, ...(ots ? { ots } : {}) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[cron/anchor] re-anchoring failed:', err)
    return NextResponse.json({ ok: false, error: 'Re-anchoring failed' }, { status: 500 })
  }
}
