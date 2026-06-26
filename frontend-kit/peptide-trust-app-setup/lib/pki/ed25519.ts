import {
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  createPublicKey,
  createPrivateKey,
  type KeyObject,
} from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* -----------------------------------------------------------------------
   PKI abstraction for oracle-signed artifacts (COA, custody steps).

   Pure Node-crypto implementation (no 'server-only' here, so CLI scripts can
   import it). App code imports the server-only re-export from ./provider.

   Oracles hold a private key; the registry stores only their public key
   (sources.pubkey) and verifies signatures on submission. Algorithm is
   Ed25519 across all providers, so a signature produced by any provider
   verifies identically — switching providers never changes the on-record
   signature format or the verification path.

   Providers (PKI_PROVIDER):
     mock → dev signing key read from .oracle-dev-key.pem (gitignored).
     env  → signing key from the PKI_PRIVATE_KEY secret (Vercel env). Free,
            no external account; the key never lives in the repo or DB and
            rotates by swapping the env var.
   A managed cloud KMS/HSM (AWS/GCP) can be added later as another case
   without touching verification or stored signatures.
   ----------------------------------------------------------------------- */

export interface KeyPairPem {
  publicKeyPem: string
  privateKeyPem: string
}

export interface PkiProvider {
  readonly name: string
  readonly algorithm: string
  /** Sign a payload string with the provider's signing key → base64 signature. */
  sign(payload: string): string
  /** SPKI PEM of the public key matching this provider's signing key. */
  getPublicKeyPem(): string
  /** Verify a base64 signature over payload against a PEM public key. */
  verify(publicKeyPem: string, payload: string, signatureB64: string): boolean
}

/** Generate a fresh Ed25519 key pair (PEM-encoded). Used by seeders/keygen. */
export function generateEd25519KeyPair(): KeyPairPem {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { publicKeyPem: publicKey as string, privateKeyPem: privateKey as string }
}

function signWith(privateKey: KeyObject, payload: string): string {
  return cryptoSign(null, Buffer.from(payload), privateKey).toString('base64')
}

function verifyEd25519(publicKeyPem: string, payload: string, signatureB64: string): boolean {
  try {
    const key = createPublicKey(publicKeyPem)
    return cryptoVerify(null, Buffer.from(payload), key, Buffer.from(signatureB64, 'base64'))
  } catch {
    return false
  }
}

/**
 * Local dev provider. Loads the demo oracle private key from
 * .oracle-dev-key.pem (created by `npm run db:seed:oracle`). The key is read
 * lazily, so verify-only usage works without the file present.
 */
export class MockPkiProvider implements PkiProvider {
  readonly name = 'mock'
  readonly algorithm = 'ed25519'
  private key?: KeyObject

  private load(): KeyObject {
    if (this.key) return this.key
    const path = resolve(process.cwd(), '.oracle-dev-key.pem')
    let pem: string
    try {
      pem = readFileSync(path, 'utf8')
    } catch {
      throw new Error(
        'MockPkiProvider: dev signing key not found at .oracle-dev-key.pem — run `npm run db:seed:oracle` (or set PKI_PROVIDER=env with PKI_PRIVATE_KEY).',
      )
    }
    this.key = createPrivateKey(pem)
    return this.key
  }

  sign(payload: string): string {
    return signWith(this.load(), payload)
  }

  getPublicKeyPem(): string {
    return createPublicKey(this.load()).export({ type: 'spki', format: 'pem' }) as string
  }

  verify(publicKeyPem: string, payload: string, signatureB64: string): boolean {
    return verifyEd25519(publicKeyPem, payload, signatureB64)
  }
}

/**
 * Reads the PEM (or base64-encoded PEM) Ed25519 private key out of an env var.
 * Accepts a raw PEM (optionally with literal "\n"), or base64 of the PEM.
 */
function pemFromEnvValue(raw: string): string {
  const v = raw.trim()
  if (v.includes('BEGIN')) return v.replace(/\\n/g, '\n')
  return Buffer.from(v, 'base64').toString('utf8')
}

/**
 * Env-secret provider. The Ed25519 signing key is supplied via PKI_PRIVATE_KEY
 * (set as a secret in the host's env store — never committed). Free and
 * accountless; a real KMS/HSM can replace this later without format changes.
 * Key material is loaded lazily so verify-only callers don't require the secret.
 */
export class EnvKeyPkiProvider implements PkiProvider {
  readonly name = 'env'
  readonly algorithm = 'ed25519'
  private key?: KeyObject

  private load(): KeyObject {
    if (this.key) return this.key
    const raw = process.env.PKI_PRIVATE_KEY
    if (!raw) {
      throw new Error('EnvKeyPkiProvider: PKI_PRIVATE_KEY is required to sign (set it as a secret env var).')
    }
    try {
      this.key = createPrivateKey(pemFromEnvValue(raw))
    } catch {
      throw new Error('EnvKeyPkiProvider: PKI_PRIVATE_KEY is not a valid Ed25519 PKCS#8 key (PEM or base64-of-PEM).')
    }
    return this.key
  }

  sign(payload: string): string {
    return signWith(this.load(), payload)
  }

  getPublicKeyPem(): string {
    return createPublicKey(this.load()).export({ type: 'spki', format: 'pem' }) as string
  }

  verify(publicKeyPem: string, payload: string, signatureB64: string): boolean {
    return verifyEd25519(publicKeyPem, payload, signatureB64)
  }
}

let cached: PkiProvider | undefined

export function getPkiProvider(): PkiProvider {
  if (cached) return cached
  switch (process.env.PKI_PROVIDER) {
    case 'env':
      cached = new EnvKeyPkiProvider()
      break
    default:
      cached = new MockPkiProvider()
  }
  return cached
}
