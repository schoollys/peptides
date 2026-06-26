/**
 * Executable smoke test for the OpenTimestamps wrapper (the app has no unit-test
 * runner). Hits the live public calendars, so it needs outbound network but no
 * account/key. Asserts: stamp → serialize → round-trip deserialize → verify
 * returns a well-formed (pending) verdict.
 *
 * Run: npm run ots:selftest
 */
import { createHash } from 'node:crypto'
import { stampAnchorHash, verifyProof, describeProof } from '../lib/anchor/ots'

async function main() {
  const payload = `selftest|${new Date().toISOString()}|${Math.random()}`
  const anchorHash = '0x' + createHash('sha256').update(payload).digest('hex')
  console.log('anchor hash:', anchorHash)

  console.log('stamping against public calendars…')
  const proof = await stampAnchorHash(anchorHash)
  if (!proof || proof.length < 32) throw new Error('proof too small / empty')
  console.log(`proof: ${proof.length} bytes (${proof.toString('base64').length} b64 chars)`)

  const verdict = await verifyProof(proof, anchorHash)
  console.log('verify verdict:', JSON.stringify(verdict))
  if (typeof verdict.pending !== 'boolean') throw new Error('verdict.pending malformed')
  // A freshly stamped proof is always pending until Bitcoin confirms (~hours).
  if (!verdict.pending) console.log('note: already confirmed (unexpected but fine)')

  console.log('--- proof info ---')
  console.log(describeProof(proof))

  console.log('\nOTS self-test PASSED')
}

main().catch((e) => {
  console.error('OTS self-test FAILED:', e)
  process.exit(1)
})
