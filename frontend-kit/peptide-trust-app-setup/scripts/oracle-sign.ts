/**
 * Demo oracle signer. Builds a canonical COA payload and signs it with the
 * configured PKI provider (PKI_PROVIDER=mock → .oracle-dev-key.pem; =env →
 * PKI_PRIVATE_KEY) so you can exercise POST /api/oracle/coa.
 *
 * Usage: npx tsx scripts/oracle-sign.ts <participantSlug> <factor> <value> [mediaHash]
 * Prints JSON: { "payload": "...", "signature": "..." }
 */
import { randomUUID } from 'node:crypto'
import { getPkiProvider } from '../lib/pki/ed25519'

const [, , slug, factor, valueStr, mediaHashArg] = process.argv
if (!slug || !factor || !valueStr) {
  console.error('Usage: tsx scripts/oracle-sign.ts <slug> <factor> <value> [mediaHash]')
  process.exit(1)
}

const payload = JSON.stringify({
  participantSlug: slug,
  factor,
  value: Number(valueStr),
  mediaHash: mediaHashArg ?? 'media_' + randomUUID(),
  issuedAt: new Date().toISOString(),
})

const signature = getPkiProvider().sign(payload)
console.log(JSON.stringify({ payload, signature }))
