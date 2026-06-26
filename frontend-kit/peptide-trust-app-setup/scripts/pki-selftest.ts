/**
 * Self-test for the configured PKI provider. Signs a sample payload, verifies
 * it against the provider's own public key, and confirms a tampered payload
 * fails. Exercises whatever PKI_PROVIDER points at (mock | env).
 *
 * Run: npm run pki:selftest
 *   (for env provider: PKI_PROVIDER=env PKI_PRIVATE_KEY=... npm run pki:selftest)
 */
import { getPkiProvider } from '../lib/pki/ed25519'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`✗ ${msg}`)
    process.exit(1)
  }
  console.log(`✓ ${msg}`)
}

const pki = getPkiProvider()
console.log(`PKI provider: ${pki.name} (${pki.algorithm})`)

const payload = JSON.stringify({ test: 'peptidetrust-pki-selftest', ts: new Date().toISOString() })

const pub = pki.getPublicKeyPem()
assert(pub.includes('BEGIN PUBLIC KEY'), 'derived a public key (SPKI PEM)')

const sig = pki.sign(payload)
assert(typeof sig === 'string' && sig.length > 0, 'produced a base64 signature')

assert(pki.verify(pub, payload, sig) === true, 'signature verifies against the public key')

assert(
  pki.verify(pub, payload + 'x', sig) === false,
  'tampered payload is rejected',
)

console.log('\nPKI self-test passed.')
