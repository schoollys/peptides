import { NextResponse } from 'next/server'
import { getKybProvider, type KybInput, type RequestedLevel } from '@/lib/kyb/provider'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import { rateLimitAsync, clientKey } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const LEVELS: RequestedLevel[] = ['L1', 'L2', 'L3']

export async function POST(request: Request) {
  const rl = await rateLimitAsync(clientKey(request, 'kyb'), 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: Partial<KybInput>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const legalName = (body.legalName ?? '').trim()
  const jurisdiction = (body.jurisdiction ?? '').trim()
  const requestedLevel = body.requestedLevel
  if (!legalName) return NextResponse.json({ error: 'Укажите наименование юрлица' }, { status: 400 })
  if (!requestedLevel || !LEVELS.includes(requestedLevel)) {
    return NextResponse.json({ error: 'Выберите уровень проверки' }, { status: 400 })
  }

  const input: KybInput = {
    legalName,
    jurisdiction,
    requestedLevel,
    contact: body.contact?.trim(),
    participantId: body.participantId,
    documents: body.documents ?? [],
  }

  const result = await getKybProvider().verify(input)

  // Persist the claim when a database is configured (best-effort; never blocks the user).
  if (isDatabaseEnabled()) {
    try {
      const sql = getSql()
      await sql`
        INSERT INTO claims
          (participant_id, contact, legal_name, jurisdiction, requested_level,
           granted_level, status, provider_ref, estimated_provisional_at)
        VALUES (
          ${input.participantId ?? null},
          ${input.contact ?? input.legalName},
          ${input.legalName},
          ${input.jurisdiction || null},
          ${input.requestedLevel},
          ${result.grantedLevel},
          ${result.status},
          ${result.providerRef},
          ${result.estimatedProvisionalAt ?? null}
        )
      `
    } catch {
      // Swallow persistence errors — verification result is still returned.
    }
  }

  return NextResponse.json({ result })
}
