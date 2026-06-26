'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, ExternalLink } from 'lucide-react'

/**
 * On-chain (OpenTimestamps → Bitcoin) proof state for an anchor hash. Mirrors
 * the `proof` object returned by GET /api/anchors/verify (lib/anchor/service.ts
 * → AnchorProofInfo). Kept local so client components don't import server code.
 */
export interface AnchorProofInfo {
  status: 'pending' | 'anchored' | 'failed'
  chain: string
  bitcoinHeight: number | null
  bitcoinTime: string | null
}

/** Public Bitcoin block explorer for a confirmed OTS attestation. */
function blockExplorerUrl(height: number): string {
  return `https://mempool.space/block/${height}`
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

/**
 * Presentational Bitcoin-anchor status. Render when you already have the proof
 * (e.g. the /verify page, which gets it in the API response).
 */
export function BitcoinProof({ proof }: { proof: AnchorProofInfo | null }) {
  if (!proof) return null

  if (proof.status === 'anchored' && proof.bitcoinHeight != null) {
    const when = formatDate(proof.bitcoinTime)
    return (
      <div
        className="rounded-lg px-3 py-2.5"
        style={{ background: 'rgba(0,178,97,.07)', border: '1px solid rgba(0,178,97,.25)' }}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'rgba(0,178,97,.12)', color: '#006d3d' }}
          >
            <CheckCircle2 size={11} />
            Подтверждено в Bitcoin
          </span>
          <a
            href={blockExplorerUrl(proof.bitcoinHeight)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs font-medium hover:underline"
            style={{ color: '#533afd' }}
          >
            блок #{proof.bitcoinHeight.toLocaleString('ru-RU')}
            <ExternalLink size={11} />
          </a>
        </div>
        {when && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Зафиксировано в блокчейне: {when} UTC
          </p>
        )}
      </div>
    )
  }

  // pending (or the rare 'failed') — submitted to the public OTS calendars,
  // awaiting inclusion + confirmation in a Bitcoin block.
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: 'rgba(201,162,39,.10)', border: '1px solid rgba(201,162,39,.25)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: 'rgba(201,162,39,.16)', color: '#8a6800' }}
        >
          <Clock size={11} />
          Ожидает подтверждения в Bitcoin
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        Хеш отправлен в публичные календари{' '}
        <a
          href="https://opentimestamps.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: '#533afd' }}
        >
          OpenTimestamps
        </a>
        . Привязка к блоку появится в течение нескольких часов.
      </p>
    </div>
  )
}

/**
 * Fetches the proof for an anchor hash and renders <BitcoinProof>. Use where the
 * proof isn't already loaded (e.g. the profile Integrity tab, whose participant
 * payload doesn't carry proof metadata).
 */
export function BitcoinProofForHash({ hash }: { hash: string }) {
  const [loading, setLoading] = useState(true)
  const [proof, setProof] = useState<AnchorProofInfo | null>(null)

  useEffect(() => {
    if (!hash || hash === '—') {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    fetch(`/api/anchors/verify?hash=${encodeURIComponent(hash)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { match?: { proof?: AnchorProofInfo | null } } | null) => {
        if (active) setProof(data?.match?.proof ?? null)
      })
      .catch(() => {
        if (active) setProof(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [hash])

  if (loading) {
    return <p className="text-[11px] text-muted-foreground">Проверка статуса в Bitcoin…</p>
  }
  return <BitcoinProof proof={proof} />
}
