import { NextResponse } from 'next/server'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import {
  getComplyCubeConfig,
  verifyWebhookSignature,
  mapOutcome,
  type ComplyCubeWebhookEvent,
} from '@/lib/kyb/complycube'

export const runtime = 'nodejs'

/*
 * ComplyCube webhook sink. ComplyCube signs each delivery with the webhook
 * secret (HMAC-SHA256 hex in the `complycube-signature` header). We verify it,
 * dedupe by the signature, and promote the matching onboarding claim /
 * participant when a KYB check lands `clear`. Only opaque ids + the outcome are
 * persisted (ADR-007: raw KYB data stays at ComplyCube).
 *
 * Returns 200 on every authenticated delivery so ComplyCube stops retrying —
 * even when there's nothing to update (unknown client, db disabled).
 */
export async function POST(request: Request) {
  const raw = await request.text()

  let webhookSecret: string | undefined
  try {
    webhookSecret = getComplyCubeConfig().webhookSecret
  } catch {
    return NextResponse.json({ error: 'ComplyCube is not configured' }, { status: 503 })
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: 'COMPLYCUBE_WEBHOOK_SECRET is not set' }, { status: 503 })
  }

  const signature = request.headers.get('complycube-signature')
  if (!verifyWebhookSignature(raw, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: ComplyCubeWebhookEvent
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const clientId = event.payload?.clientId ?? null
  const outcome = event.payload?.outcome ?? null
  const status = mapOutcome(outcome ?? undefined)

  if (!isDatabaseEnabled()) {
    return NextResponse.json({ ok: true, persisted: false })
  }

  const sql = getSql()

  // Idempotency: the signature is unique per delivery body. Skip if seen.
  try {
    const inserted = await sql`
      INSERT INTO kyb_webhook_events
        (provider, event_type, applicant_id, external_user_id, review_answer, signature_ok, digest, payload)
      VALUES ('complycube', ${event.type ?? null}, ${clientId}, ${null},
              ${outcome}, ${true}, ${signature}, ${sql.json(event as object)})
      ON CONFLICT (digest) DO NOTHING
      RETURNING id
    `
    if (inserted.length === 0) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
  } catch {
    // Audit insert failing shouldn't block the state update below.
  }

  // Only check.completed carries a final decision worth acting on.
  if (event.type !== 'check.completed' || !outcome) {
    return NextResponse.json({ ok: true, processed: false })
  }

  try {
    const claims = await sql<{ id: string; participant_id: string | null; requested_level: string | null }[]>`
      SELECT id, participant_id, requested_level
        FROM claims
       WHERE ${clientId}::text IS NOT NULL AND provider_ref = ${clientId}
       ORDER BY created_at DESC
       LIMIT 1
    `
    const claim = claims[0]

    const grantedLevel = (
      status === 'verified'
        ? (claim?.requested_level && /^L[0-3]$/.test(claim.requested_level) ? claim.requested_level : 'L2')
        : 'L0'
    ) as 'L0' | 'L1' | 'L2' | 'L3'

    if (claim) {
      await sql`
        UPDATE claims
           SET status = ${status},
               granted_level = ${grantedLevel}
         WHERE id = ${claim.id}
      `
    }

    if (status === 'verified' && claim?.participant_id) {
      await sql`
        UPDATE participants
           SET kyb_level = ${grantedLevel},
               is_verified_legal = TRUE,
               updated_at = now()
         WHERE id = ${claim.participant_id}
      `
      await sql`
        INSERT INTO identity_verifications
          (participant_id, level, provider_ref, verified_at, pop_method)
        VALUES (${claim.participant_id}, ${grantedLevel}, ${clientId}, now(), 'complycube_kyb')
        ON CONFLICT (participant_id, level)
        DO UPDATE SET provider_ref = EXCLUDED.provider_ref, verified_at = EXCLUDED.verified_at
      `
    }
  } catch {
    return NextResponse.json({ ok: true, processed: false })
  }

  return NextResponse.json({ ok: true, processed: true, status })
}
