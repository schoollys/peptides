/**
 * Thin Node-only wrapper around the `opentimestamps` library.
 *
 * OpenTimestamps anchors a SHA-256 digest into the Bitcoin blockchain for free
 * via public calendar servers — no account, no API key, no gas. Confirmation is
 * asynchronous (the calendars aggregate submissions into a Merkle tree and
 * commit the root to Bitcoin every hour or so), so the flow is two-phase:
 *
 *   1. stamp(hash)   → submit to calendars, get a "pending" .ots proof now.
 *   2. upgrade(proof) → hours later, fetch the Bitcoin attestation; the proof
 *                       becomes independently verifiable against a block.
 *
 * Per ADR-005 only the opaque digest is ever transmitted — never a payload.
 *
 * This module is intentionally free of `server-only` so it can run from both the
 * cron route (Next.js Node runtime) and standalone tsx scripts. The heavy CJS
 * dependency tree (request/bitcore) is kept out of the client/edge bundle via
 * `serverExternalPackages` in next.config.mjs.
 */
import OpenTimestamps from 'opentimestamps'

interface DetachedTimestamp {
  serializeToBytes(): number[]
}

interface OtsLib {
  DetachedTimestampFile: {
    fromHash(op: unknown, hash: Buffer): DetachedTimestamp
    deserialize(bytes: number[] | Buffer): DetachedTimestamp
  }
  Ops: { OpSHA256: new () => unknown }
  stamp(detached: DetachedTimestamp): Promise<void>
  upgrade(detached: DetachedTimestamp): Promise<boolean>
  verify(
    detached: DetachedTimestamp,
    original: DetachedTimestamp,
    options?: Record<string, unknown>,
  ): Promise<Record<string, { height?: number; timestamp?: number }> | undefined>
  info(detached: DetachedTimestamp): string
}

const ots = OpenTimestamps as unknown as OtsLib

/** A confirmed Bitcoin attestation extracted from an OTS proof. */
export interface BitcoinAttestation {
  height: number
  /** Block time as ISO-8601 (UTC), when the calendar reports it. */
  time: string | null
}

export interface OtsVerifyResult {
  /** True while the proof is still waiting on Bitcoin confirmation. */
  pending: boolean
  bitcoin: BitcoinAttestation | null
}

/** Strip an optional `0x` prefix; OTS works on the raw 32-byte digest. */
function digestFromAnchorHash(anchorHash: string): Buffer {
  const hex = anchorHash.startsWith('0x') ? anchorHash.slice(2) : anchorHash
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`Not a sha256 anchor hash: ${anchorHash}`)
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Submit a SHA-256 anchor hash to the public OpenTimestamps calendars and
 * return the serialized (still pending) .ots proof. Network call.
 */
export async function stampAnchorHash(anchorHash: string): Promise<Buffer> {
  const detached = ots.DetachedTimestampFile.fromHash(
    new ots.Ops.OpSHA256(),
    digestFromAnchorHash(anchorHash),
  )
  await ots.stamp(detached)
  return Buffer.from(detached.serializeToBytes())
}

/**
 * Try to upgrade a pending proof by fetching the Bitcoin attestation from the
 * calendars. Returns the (possibly unchanged) proof bytes and whether new
 * attestation data was merged in. Network call.
 */
export async function upgradeProof(
  proof: Buffer,
): Promise<{ proof: Buffer; changed: boolean }> {
  const detached = ots.DetachedTimestampFile.deserialize(Array.from(proof))
  const changed = await ots.upgrade(detached)
  return { proof: changed ? Buffer.from(detached.serializeToBytes()) : proof, changed }
}

/**
 * Verify a proof against its anchor hash. While pending, `bitcoin` is null and
 * `pending` is true. Once the commitment confirms, returns the Bitcoin block
 * height (and time when available). Network call (queries a block explorer).
 */
export async function verifyProof(
  proof: Buffer,
  anchorHash: string,
): Promise<OtsVerifyResult> {
  const digest = digestFromAnchorHash(anchorHash)
  const detached = ots.DetachedTimestampFile.deserialize(Array.from(proof))
  const original = ots.DetachedTimestampFile.fromHash(new ots.Ops.OpSHA256(), digest)

  const result = (await ots.verify(detached, original)) ?? {}
  const btc = result.bitcoin
  if (btc && typeof btc.height === 'number') {
    return {
      pending: false,
      bitcoin: {
        height: btc.height,
        time: typeof btc.timestamp === 'number' ? new Date(btc.timestamp * 1000).toISOString() : null,
      },
    }
  }
  return { pending: true, bitcoin: null }
}

/** Human-readable dump of a proof's timestamp tree (for CLI/debugging). */
export function describeProof(proof: Buffer): string {
  return ots.info(ots.DetachedTimestampFile.deserialize(Array.from(proof)))
}
