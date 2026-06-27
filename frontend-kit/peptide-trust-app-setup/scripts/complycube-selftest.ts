/**
 * Self-test for the ComplyCube KYB integration.
 *
 *  1. Always: webhook signature verify round-trip (HMAC-SHA256, local crypto)
 *     and outcome → status mapping. No network, no credentials needed.
 *  2. When COMPLYCUBE_API_KEY is set: a live authenticated GET /clients to
 *     confirm the API key works against the configured base URL.
 *
 * Run: npm run kyb:selftest:complycube
 *   live: COMPLYCUBE_API_KEY=test_... npm run kyb:selftest:complycube
 */
import { createHmac } from 'node:crypto'
import { getComplyCubeConfig, verifyWebhookSignature, mapOutcome } from '../lib/kyb/complycube'

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
  const body = JSON.stringify({ type: 'check.completed', payload: { outcome: 'clear' } })
  const sig = createHmac('sha256', secret).update(body).digest('hex')

  assert(verifyWebhookSignature(body, sig, secret) === true, 'webhook signature verifies (HMAC_SHA256)')
  assert(verifyWebhookSignature(body + 'x', sig, secret) === false, 'tampered webhook body is rejected')
  assert(verifyWebhookSignature(body, sig, 'wrong-secret') === false, 'wrong webhook secret is rejected')
  assert(mapOutcome('clear') === 'verified', 'clear → verified')
  assert(mapOutcome('attention') === 'pending', 'attention → pending')
  assert(mapOutcome('rejected') === 'rejected', 'rejected → rejected')

  // 2. Live check (only when an API key is present) ---------------------------
  if (!process.env.COMPLYCUBE_API_KEY) {
    console.log('\n• Live API check skipped (set COMPLYCUBE_API_KEY to run it).')
    console.log('\nComplyCube self-test passed (local checks).')
    return
  }

  const cfg = getComplyCubeConfig()
  console.log(`\nComplyCube: ${cfg.baseUrl} · check "${cfg.checkType}"`)
  const res = await fetch(`${cfg.baseUrl}/clients?limit=1`, {
    headers: { Authorization: cfg.apiKey, Accept: 'application/json' },
    cache: 'no-store',
  })
  const text = await res.text()
  assert(res.ok, `GET /clients authenticated (HTTP ${res.status})${res.ok ? '' : ': ' + text.slice(0, 200)}`)

  console.log('\nComplyCube self-test passed.')
}

main().catch(err => {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
