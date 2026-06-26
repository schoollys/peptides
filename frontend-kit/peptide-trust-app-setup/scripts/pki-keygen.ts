/**
 * Generate a fresh Ed25519 signing key for the env-secret PKI provider.
 *
 * Prints:
 *   • PKI_PRIVATE_KEY — base64 of the PKCS#8 PEM (set as a secret env var)
 *   • the public key PEM (stored in sources.pubkey via `npm run pki:sync-oracle`)
 *
 * The private key is NEVER written to disk or the repo. Copy it straight into
 * your host's secret store (e.g. Vercel → Settings → Environment Variables).
 *
 * Run: npm run pki:keygen
 */
import { generateEd25519KeyPair } from '../lib/pki/ed25519'

const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair()
const privateB64 = Buffer.from(privateKeyPem, 'utf8').toString('base64')

console.log('# ── PeptideTrust PKI signing key (Ed25519) ──────────────────────────')
console.log('# 1) Set these env vars (secret) in your host / .env.local:')
console.log('')
console.log('PKI_PROVIDER=env')
console.log(`PKI_PRIVATE_KEY=${privateB64}`)
console.log('')
console.log('# 2) Publish the matching public key into the DB so COA verification passes:')
console.log('#    PKI_PRIVATE_KEY=... DATABASE_URL=... npm run pki:sync-oracle')
console.log('')
console.log('# Public key (SPKI PEM) — informational; sync-oracle derives it automatically:')
console.log(publicKeyPem.trim())
