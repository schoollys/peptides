import { NextResponse } from 'next/server'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import {
  getSumsubConfig,
  verifyWebhookSignature,
  mapReviewAnswer,
  levelNameToKybLevel,
  type SumsubWebhookPayload,
} from '@/lib/kyb/sumsub'

export const runtime = 'nodejs'

/*
 * Sumsub webhook sink. Sumsub signs each delivery with the webhook secret
 * (x-payload-digest + x-payload-digest-alg). We verify that signature, dedupe
 * by the digest, and promote the matching onboarding claim / participant when a
 * KYB review lands GREEN. Only opaque ids + the review answer are persisted
 * (ADR-007: raw KYB data stays at Sumsub).
 *
 * Returns 200 on every authenticated delivery so Sumsub stops retrying — even
 * when we have nothing to update (unknown applicant, db disabled).
 */
export async function POST(request: Request) {
  const raw = await request.text()

  let webhookSecret: string | undefined
  try {
    webhookSecret = getSumsubConfig().webhookSecret
  } catch {
    return NextResponse.json({ error: 'Sumsub is not configured' }, { status: 503 })
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: 'SUMSUB_WEBHOOK_SECRET is not set' }, { status: 503 })
  }

  const digest = request.headers.get('x-payload-digest')
  const algo = request.headers.get('x-payload-digest-alg')
  if (!verifyWebhookSignature(raw, digest, algo, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: SumsubWebhookPayload
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const applicantId = event.applicantId ?? null
  const externalUserId = event.externalUserId ?? null
  const reviewAnswer = event.reviewResult?.reviewAnswer ?? null
  const status = mapReviewAnswer(reviewAnswer ?? undefined, event.reviewResult?.reviewRejectType)

  if (!isDatabaseEnabled()) {
    // Nothing to persist; acknowledge so Sumsub doesn't retry.
    return NextResponse.json({ ok: true, persisted: false })
  }

  const sql = getSql()

  // Idempotency: the digest is unique per delivery. Skip if already processed.
  try {
    const inserted = await sql`
      INSERT INTO kyb_webhook_events
        (provider, event_type, applicant_id, external_user_id, review_answer, signature_ok, digest, payload)
      VALUES ('sumsub', ${event.type ?? null}, ${applicantId}, ${externalUserId},
              ${reviewAnswer}, ${true}, ${digest}, ${sql.json(event as object)})
      ON CONFLICT (digest) DO NOTHING
      RETURNING id
    `
    if (inserted.length === 0) {
      return NextResponse.json({ ok: true, duplicate: true })
    }
  } catch {
    // Audit insert failing shouldn't block the state update below.
  }

  // Only applicantReviewed carries a final decision worth acting on.
  if (event.type !== 'applicantReviewed' || !reviewAnswer) {
    return NextResponse.json({ ok: true, processed: false })
  }

  try {
    const claims = await sql<{ id: string; participant_id: string | null; requested_level: string | null }[]>`
      SELECT id, participant_id, requested_level
        FROM claims
       WHERE (${applicantId}::text IS NOT NULL AND provider_ref = ${applicantId})
          OR (${externalUserId}::text IS NOT NULL AND external_user_id = ${externalUserId})
       ORDER BY created_at DESC
       LIMIT 1
    `
    const claim = claims[0]

    const grantedLevel =
      status === 'verified'
        ? ((claim?.requested_level && /^L[0-3]$/.test(claim.requested_level)
            ? claim.requested_level
            : levelNameToKybLevel(event.levelName)) as 'L0' | 'L1' | 'L2' | 'L3')
        : 'L0'

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
        VALUES (${claim.participant_id}, ${grantedLevel}, ${applicantId}, now(), 'sumsub_kyb')
        ON CONFLICT (participant_id, level)
        DO UPDATE SET provider_ref = EXCLUDED.provider_ref, verified_at = EXCLUDED.verified_at
      `
    }
  } catch {
    // Acknowledge anyway; the event is recorded and can be reprocessed.
    return NextResponse.json({ ok: true, processed: false })
  }

  return NextResponse.json({ ok: true, processed: true, status })
}
