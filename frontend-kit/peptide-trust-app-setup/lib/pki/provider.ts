import 'server-only'
import {
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  createPublicKey,
  createPrivateKey,
} from 'node:crypto'

/* -----------------------------------------------------------------------
   PKI abstraction for oracle-signed artifacts (COA, custody steps).

   Oracles hold a private key; the registry stores only their public key
   (sources.pubkey) and verifies signatures on submission. The MVP uses
   Ed25519 via Node crypto — no external dependency. A managed PKI/HSM or a
   vendor KMS can replace MockPkiProvider behind getPkiProvider() later.
   ----------------------------------------------------------------------- */

export interface KeyPairPem {
  publicKeyPem: string
  privateKeyPem: string
}

export interface PkiProvider {
  readonly name: string
  readonly algorithm: string
  generateKeyPair(): KeyPairPem
  /** Sign a payload string with a PEM private key → base64 signature. */
  sign(privateKeyPem: string, payload: string): string
  /** Verify a base64 signature over payload against a PEM public key. */
  verify(publicKeyPem: string, payload: string, signatureB64: string): boolean
}

export class MockPkiProvider implements PkiProvider {
  readonly name = 'mock'
  readonly algorithm = 'ed25519'

  generateKeyPair(): KeyPairPem {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })
    return { publicKeyPem: publicKey as string, privateKeyPem: privateKey as string }
  }

  sign(privateKeyPem: string, payload: string): string {
    const key = createPrivateKey(privateKeyPem)
    return cryptoSign(null, Buffer.from(payload), key).toString('base64')
  }

  verify(publicKeyPem: string, payload: string, signatureB64: string): boolean {
    try {
      const key = createPublicKey(publicKeyPem)
      return cryptoVerify(null, Buffer.from(payload), key, Buffer.from(signatureB64, 'base64'))
    } catch {
      return false
    }
  }
}

/**
 * Managed PKI skeleton (KMS/HSM-backed).
 *
 * Verification is local Ed25519 — it needs only the public key, so it works for
 * signatures produced by oracle keys or a KMS/HSM identically. Key generation
 * and signing in a managed setup are asynchronous, remote operations (KMS API)
 * or happen on the oracle's side; they intentionally throw here so the sync
 * server interface can never silently fall back to insecure local key material.
 * Wire an async KMS client into the COA/custody signing path when adopting this.
 */
export class ManagedPkiProvider implements PkiProvider {
  readonly name = 'managed'
  readonly algorithm = 'ed25519'

  generateKeyPair(): KeyPairPem {
    throw new Error(
      'ManagedPkiProvider: key generation must use the KMS/HSM async API, not the sync provider',
    )
  }

  sign(): string {
    throw new Error(
      'ManagedPkiProvider: signing happens in the oracle/KMS (async); the server only verifies',
    )
  }

  verify(publicKeyPem: string, payload: string, signatureB64: string): boolean {
    try {
      const key = createPublicKey(publicKeyPem)
      return cryptoVerify(null, Buffer.from(payload), key, Buffer.from(signatureB64, 'base64'))
    } catch {
      return false
    }
  }
}

let cached: PkiProvider | undefined

export function getPkiProvider(): PkiProvider {
  if (cached) return cached
  switch (process.env.PKI_PROVIDER) {
    case 'managed':
      cached = new ManagedPkiProvider()
      break
    default:
      cached = new MockPkiProvider()
  }
  return cached
}
