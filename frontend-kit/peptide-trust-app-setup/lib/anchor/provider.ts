import 'server-only'
import { createHash } from 'node:crypto'

/* -----------------------------------------------------------------------
   On-chain anchor abstraction.

   The MVP ships a MockAnchorProvider that produces a deterministic hash
   instead of writing to a real L2. Call sites only depend on the
   AnchorProvider interface, so a real chain client (e.g. an L2 rollup or a
   notary service) can be dropped in behind getAnchorProvider() later.

   ADR-005: only anonymous hashes are anchored — never raw payloads.
   ----------------------------------------------------------------------- */

export interface AnchorReceipt {
  /** 0x-prefixed anchor hash committed to the ledger */
  anchorHash: string
  /** Opaque transaction reference from the ledger */
  txRef: string
  /** Logical chain/ledger identifier */
  chain: string
  anchoredAt: string
}

export interface AnchorProvider {
  readonly name: string
  /** Anchor an opaque payload string and return a receipt. */
  anchor(payload: string): Promise<AnchorReceipt>
  /** Recompute the anchor hash a payload would produce (no side effects). */
  hashOf(payload: string): string
}

export class MockAnchorProvider implements AnchorProvider {
  readonly name = 'mock'
  readonly chain = 'mock-l2'

  hashOf(payload: string): string {
    return '0x' + createHash('sha256').update(payload).digest('hex')
  }

  async anchor(payload: string): Promise<AnchorReceipt> {
    const anchorHash = this.hashOf(payload)
    const txRef = '0x' + createHash('sha256').update('tx:' + payload).digest('hex').slice(0, 40)
    return { anchorHash, txRef, chain: this.chain, anchoredAt: new Date().toISOString() }
  }
}

/**
 * Generic HTTP anchor skeleton for an L2 relayer / notary service. Works once
 * ANCHOR_API_URL + ANCHOR_API_KEY are set. Per ADR-005 only the opaque hash is
 * ever transmitted — never the payload. Adapt the request/response to your
 * ledger client. Call sites only see the AnchorProvider interface.
 */
export class HttpAnchorProvider implements AnchorProvider {
  readonly name = 'http'
  private readonly apiUrl: string
  private readonly apiKey: string
  private readonly chain: string

  constructor() {
    const apiUrl = process.env.ANCHOR_API_URL
    const apiKey = process.env.ANCHOR_API_KEY
    if (!apiUrl || !apiKey) {
      throw new Error('HttpAnchorProvider requires ANCHOR_API_URL and ANCHOR_API_KEY')
    }
    this.apiUrl = apiUrl.replace(/\/+$/, '')
    this.apiKey = apiKey
    this.chain = process.env.ANCHOR_CHAIN ?? 'l2'
  }

  hashOf(payload: string): string {
    return '0x' + createHash('sha256').update(payload).digest('hex')
  }

  async anchor(payload: string): Promise<AnchorReceipt> {
    const anchorHash = this.hashOf(payload)
    // TODO(vendor): post `anchorHash` (NOT the payload) to your relayer/notary.
    const res = await fetch(`${this.apiUrl}/anchors`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: anchorHash, chain: this.chain }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Anchor vendor error ${res.status}: ${detail.slice(0, 200)}`)
    }
    const data = (await res.json().catch(() => ({}))) as {
      tx_ref?: string
      tx_hash?: string
      anchored_at?: string
    }
    return {
      anchorHash,
      txRef: data.tx_ref ?? data.tx_hash ?? '',
      chain: this.chain,
      anchoredAt: data.anchored_at ?? new Date().toISOString(),
    }
  }
}

let cached: AnchorProvider | undefined

export function getAnchorProvider(): AnchorProvider {
  if (cached) return cached
  switch (process.env.ANCHOR_PROVIDER) {
    case 'http':
      cached = new HttpAnchorProvider()
      break
    default:
      cached = new MockAnchorProvider()
  }
  return cached
}

/** Canonical, stable payload for a score snapshot (what gets hashed/anchored). */
export function scoreAnchorPayload(input: {
  participantSlug: string
  score: number
  algoVersion: string | number
  inputsHash: string
  computedAt: string
}): string {
  return [
    'score',
    input.participantSlug,
    input.score,
    input.algoVersion,
    input.inputsHash,
    input.computedAt,
  ].join('|')
}
