import { NextResponse } from 'next/server'
import { rateLimitAsync, clientKey } from '@/lib/rate-limit'
import { getSumsubConfig, createAccessToken } from '@/lib/kyb/sumsub'

export const runtime = 'nodejs'

/*
 * Mints a fresh short-lived WebSDK access token for an existing applicant.
 * The browser calls this when launching the Sumsub WebSDK or when the SDK fires
 * its token-expiration callback. No KYB data crosses this boundary — only a
 * scoped, expiring token keyed by the externalUserId we created the applicant
 * with.
 */
export async function POST(request: Request) {
  const rl = await rateLimitAsync(clientKey(request, 'sumsub-token'), 20, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: { externalUserId?: string; levelName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const externalUserId = (body.externalUserId ?? '').trim()
  if (!externalUserId) {
    return NextResponse.json({ error: 'externalUserId обязателен' }, { status: 400 })
  }

  let cfg
  try {
    cfg = getSumsubConfig()
  } catch {
    return NextResponse.json({ error: 'Sumsub не сконфигурирован' }, { status: 503 })
  }

  try {
    const token = await createAccessToken(cfg, {
      externalUserId,
      levelName: body.levelName?.trim() || undefined,
    })
    return NextResponse.json({ token: token.token, userId: token.userId })
  } catch {
    return NextResponse.json({ error: 'Не удалось получить токен Sumsub' }, { status: 502 })
  }
}
