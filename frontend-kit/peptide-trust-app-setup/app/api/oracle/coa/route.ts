import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { submitCoa } from '@/lib/oracle/service'
import { rateLimitAsync, clientKey } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// COA ingestion is small JSON (a signed payload + signature + media hash — never
// the media bytes themselves). Cap the request body and individual fields to
// blunt memory-abuse / oversized-payload attempts. Real file uploads (with AV
// scanning) are a separate, future surface — see go-live-checklist §4.
const MAX_BODY_BYTES = 64 * 1024
const MAX_PAYLOAD_CHARS = 16 * 1024
const MAX_SIGNATURE_CHARS = 4 * 1024

const STATUS: Record<string, number> = {
  unavailable: 503,
  bad_payload: 400,
  bad_signature: 401,
  reused: 409,
  no_oracle: 404,
  no_participant: 404,
}

export async function POST(request: Request) {
  const rl = await rateLimitAsync(clientKey(request, 'oracle'), 30, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  const declaredLen = Number(request.headers.get('content-length') ?? 0)
  if (declaredLen > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Слишком большой запрос' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Слишком большой запрос' }, { status: 413 })
  }

  let body: { payload?: string; signature?: string; oracleId?: string }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  if (!body.payload || !body.signature) {
    return NextResponse.json({ error: 'Нужны payload и signature' }, { status: 400 })
  }
  if (body.payload.length > MAX_PAYLOAD_CHARS || body.signature.length > MAX_SIGNATURE_CHARS) {
    return NextResponse.json({ error: 'Поля payload/signature слишком велики' }, { status: 413 })
  }

  const result = await submitCoa({
    payload: body.payload,
    signature: body.signature,
    oracleId: body.oracleId,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: STATUS[result.code] ?? 400 })
  }
  return NextResponse.json({ result })
}
