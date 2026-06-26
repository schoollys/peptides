'use client'

import Link from 'next/link'
import { TierPill } from '@/components/catalog/tier-pill'
import {
  FACTOR_CODES,
  FACTOR_LABELS,
  getBestByFactor,
  sortByBRRank,
  type CompareParticipant,
  type FactorCode,
} from '@/lib/compare-data'

// ─── Skeleton loader ────────────────────────────────────────────────────────
export function CompareTableSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className="rounded-[16px] border border-[#e5edf5] bg-card shadow-stripe-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-[#e5edf5]">
              <th className="w-44 px-5 py-4" />
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-5 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 rounded bg-[#e5edf5] animate-pulse" />
                    <div className="h-8 w-16 rounded bg-[#e5edf5] animate-pulse" />
                    <div className="h-3 w-24 rounded bg-[#e5edf5] animate-pulse" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 9 }).map((_, i) => (
              <tr key={i} className="border-b border-[#e5edf5]/60">
                <td className="px-5 py-3">
                  <div className="h-3 w-28 rounded bg-[#e5edf5] animate-pulse" />
                </td>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-5 py-3">
                    <div className="h-3 w-16 rounded bg-[#e5edf5] animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Factor cell ─────────────────────────────────────────────────────────────
function FactorCell({
  value,
  isBest,
  isMixed,
}: {
  value: number | null
  isBest: boolean
  isMixed: boolean
}) {
  // No measurement for this factor → honest "no data" marker (no fabricated 0).
  if (value == null) {
    return (
      <td className="px-5 py-3 text-center">
        <span className="text-sm text-[#c8d4e0]" aria-label="нет данных">—</span>
      </td>
    )
  }
  return (
    <td
      className="px-5 py-3 text-center"
      style={{
        background: isBest && !isMixed ? 'rgba(83,58,253,.06)' : 'transparent',
      }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{
            color: isBest && !isMixed ? '#533afd' : '#061b31',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {/* Mini progress bar */}
        <div
          className="w-12 h-1 rounded-full overflow-hidden"
          style={{ background: '#e5edf5' }}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${value}%`,
              background: isBest && !isMixed ? '#533afd' : '#95a4ba',
            }}
          />
        </div>
      </div>
    </td>
  )
}

// ─── Dominant factor label ───────────────────────────────────────────────────
function DominantLabel({ p }: { p: CompareParticipant }) {
  if (p.is_balanced || !p.dominant_factor) {
    return <span className="text-xs text-[#64748d]">Сбалансирован</span>
  }
  return (
    <span className="text-xs text-[#64748d]">
      преимущ.{' '}
      <span className="font-medium text-[#50617a]">
        {FACTOR_LABELS[p.dominant_factor]}
      </span>{' '}
      <span className="font-mono text-[#95a4ba]">({p.dominant_factor})</span>
    </span>
  )
}

// ─── Main compare table ──────────────────────────────────────────────────────
interface CompareTableProps {
  participants: CompareParticipant[]
  isMixed: boolean
  onRemove: (id: string) => void
}

export function CompareTable({ participants, isMixed, onRemove }: CompareTableProps) {
  const sorted = sortByBRRank(participants)
  const best = getBestByFactor(sorted)

  return (
    <div
      className="rounded-[16px] border border-[#e5edf5] bg-card shadow-stripe-md overflow-hidden"
      style={{ overflowX: 'auto' }}
    >
      <table
        className="w-full min-w-[640px] border-collapse"
        aria-label="Сравнение участников по факторам доверия"
      >
        {/* ── HEADER ── */}
        <thead>
          <tr className="border-b border-[#e5edf5]">
            {/* Row label column */}
            <th
              scope="col"
              className="w-44 px-5 py-5 text-left text-xs font-medium text-[#95a4ba] align-bottom"
            >
              Фактор
            </th>

            {sorted.map((p, idx) => (
              <th
                key={p.id}
                scope="col"
                className="px-5 py-5 text-center align-top min-w-[160px]"
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Rank badge */}
                  {!isMixed && (
                    <span
                      className="self-center mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: idx === 0 ? '#533afd' : '#e5edf5',
                        color:      idx === 0 ? '#fff'    : '#64748d',
                      }}
                      aria-label={`BR-RANK ${idx + 1}`}
                    >
                      {idx + 1}
                    </span>
                  )}

                  {/* Name + ID link */}
                  <Link
                    href={`/p/${p.id}`}
                    className="text-sm font-semibold text-[#061b31] hover:text-[#533afd] hover:underline leading-tight text-center transition-colors"
                  >
                    {p.display_name}
                  </Link>
                  <span className="text-[11px] font-mono text-[#95a4ba]">{p.id}</span>

                  {/* Score + tier — hidden in mixed mode (factors incomparable, no total Score) */}
                  {!isMixed && (
                    <>
                      <span
                        className="text-3xl font-bold leading-none tabular-nums tracking-display"
                        style={{
                          color: '#061b31',
                          fontVariantNumeric: 'tabular-nums',
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        {p.score != null ? p.score.toFixed(1) : '—'}
                      </span>

                      <TierPill tier={p.tier} size="sm" />
                    </>
                  )}

                  {/* Dominant factor */}
                  <DominantLabel p={p} />

                  {/* Remove button */}
                  <button
                    onClick={() => onRemove(p.id)}
                    className="mt-1 text-[11px] text-[#95a4ba] hover:text-[#d8351e] transition-colors"
                    aria-label={`Удалить ${p.display_name} из сравнения`}
                  >
                    ✕ Убрать
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── FACTOR ROWS ── */}
        <tbody>
          {FACTOR_CODES.map((code: FactorCode, rowIdx) => (
            <tr
              key={code}
              className="border-b border-[#e5edf5]/60 transition-colors hover:bg-[#f8fafd]"
            >
              {/* Factor label */}
              <th
                scope="row"
                className="px-5 py-3 text-left align-middle"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold font-mono text-[#50617a]">{code}</span>
                  <span className="text-[11px] text-[#95a4ba] leading-tight">{FACTOR_LABELS[code]}</span>
                </div>
              </th>

              {sorted.map((p) => (
                <FactorCell
                  key={p.id}
                  value={p.factors[code]}
                  isBest={best[code] === p.id}
                  isMixed={isMixed}
                />
              ))}
            </tr>
          ))}

          {/* ── SCORE TOTALS ROW ── */}
          {!isMixed && (
            <tr className="bg-[#f8fafd]">
              <th
                scope="row"
                className="px-5 py-4 text-left text-xs font-semibold text-[#3c4f69] align-middle"
              >
                Trust Score
                <div className="text-[10px] font-normal text-[#95a4ba] mt-0.5">BR-RANK</div>
              </th>
              {sorted.map((p, idx) => (
                <td key={p.id} className="px-5 py-4 text-center align-middle">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className="text-2xl font-bold tabular-nums"
                      style={{
                        color: idx === 0 ? '#533afd' : '#061b31',
                        fontVariantNumeric: 'tabular-nums',
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {p.score != null ? p.score.toFixed(1) : '—'}
                    </span>
                    <TierPill tier={p.tier} size="sm" />
                  </div>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
