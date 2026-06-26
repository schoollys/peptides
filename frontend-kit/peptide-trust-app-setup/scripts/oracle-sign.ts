/**
 * Demo oracle signer. Builds a canonical COA payload and signs it with the dev
 * oracle private key (.oracle-dev-key.pem) so you can exercise POST /api/oracle/coa.
 *
 * Usage: npx tsx scripts/oracle-sign.ts <participantSlug> <factor> <value> [mediaHash]
 * Prints JSON: { "payload": "...", "signature": "..." }
 */
import { sign as cryptoSign, createPrivateKey, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [, , slug, factor, valueStr, mediaHashArg] = process.argv
if (!slug || !factor || !valueStr) {
  console.error('Usage: tsx scripts/oracle-sign.ts <slug> <factor> <value> [mediaHash]')
  process.exit(1)
}

const keyPem = readFileSync(resolve(process.cwd(), '.oracle-dev-key.pem'), 'utf8')
const payload = JSON.stringify({
  participantSlug: slug,
  factor,
  value: Number(valueStr),
  mediaHash: mediaHashArg ?? 'media_' + randomUUID(),
  issuedAt: new Date().toISOString(),
})

const signature = cryptoSign(null, Buffer.from(payload), createPrivateKey(keyPem)).toString('base64')
console.log(JSON.stringify({ payload, signature }))
