/**
 * Self-test for the Sumsub KYB integration.
 *
 *  1. Always: webhook signature verify round-trip (HMAC-SHA256, local crypto)
 *     and reviewAnswer → status mapping. No network, no credentials needed.
 *  2. When SUMSUB_APP_TOKEN + SUMSUB_SECRET_KEY are set: a live signed request
 *     (mint a throwaway WebSDK access token) to confirm request signing, the
 *     app token, and SUMSUB_LEVEL_NAME all work against the API.
 *
 * Run: npm run kyb:selftest
 *   live: SUMSUB_APP_TOKEN=... SUMSUB_SECRET_KEY=... SUMSUB_LEVEL_NAME=... \
 *         npm run kyb:selftest
 */
import { createHmac } from 'node:crypto'
import {
  getSumsubConfig,
  createAccessToken,
  verifyWebhookSignature,
  mapReviewAnswer,
} from '../lib/kyb/sumsub'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`✗ ${msg}`)
    process.exit(1)
  }
  console.log(`✓ ${msg}`)
}

async function main() {
  // 1. Local checks ----------------------------------------------------------
  const secret = 'test-webhook-secret'
  const body = JSON.stringify({ type: 'applicantReviewed', applicantId: 'abc' })
  const digest = createHmac('sha256', secret).update(body).digest('hex')

  assert(
    verifyWebhookSignature(body, digest, 'HMAC_SHA256_HEX', secret) === true,
    'webhook signature verifies (HMAC_SHA256_HEX)',
  )
  assert(
    verifyWebhookSignature(body + 'x', digest, 'HMAC_SHA256_HEX', secret) === false,
    'tampered webhook body is rejected',
  )
  assert(
    verifyWebhookSignature(body, digest, 'HMAC_SHA256_HEX', 'wrong-secret') === false,
    'wrong webhook secret is rejected',
  )
  assert(mapReviewAnswer('GREEN') === 'verified', 'GREEN → verified')
  assert(mapReviewAnswer('RED', 'FINAL') === 'rejected', 'RED/FINAL → rejected')
  assert(mapReviewAnswer('RED', 'RETRY') === 'pending', 'RED/RETRY → pending')

  // 2. Live check (only when credentials are present) -------------------------
  if (!process.env.SUMSUB_APP_TOKEN || !process.env.SUMSUB_SECRET_KEY) {
    console.log('\n• Live API check skipped (set SUMSUB_APP_TOKEN + SUMSUB_SECRET_KEY to run it).')
    console.log('\nSumsub self-test passed (local checks).')
    return
  }

  const cfg = getSumsubConfig()
  console.log(`\nSumsub: ${cfg.baseUrl} · level "${cfg.levelName}"`)
  const externalUserId = `selftest-${Date.now()}`
  const token = await createAccessToken(cfg, { externalUserId, ttlInSecs: 60 })
  assert(typeof token.token === 'string' && token.token.length > 0, 'minted a WebSDK access token (auth OK)')

  console.log('\nSumsub self-test passed.')
}

main().catch(err => {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
