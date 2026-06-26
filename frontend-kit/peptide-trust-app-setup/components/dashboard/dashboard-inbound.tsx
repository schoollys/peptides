'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, Globe, Mail, Send, ArrowUpRight } from 'lucide-react'
import { readInboundStats, tierInsight } from '@/lib/inbound-log'
import type { InboundStats } from '@/lib/inbound-log'

interface Props {
  participantId: string
  tier: string
}

// ─── Sparkline (inline SVG bar chart, 30 buckets) ─────────────────────────────

function Sparkline({ daily }: { daily: number[] }) {
  const max = Math.max(...daily, 1)
  const W   = 180
  const H   = 32
  const gap = 1
  const barW = (W - gap * (daily.length - 1)) / daily.length

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {daily.map((v, i) => {
        const h    = Math.max(2, (v / max) * H)
        const x    = i * (barW + gap)
        const y    = H - h
        // Last 7 days are highlighted
        const isRecent = i >= 23
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={1}
            fill={isRecent ? '#533afd' : 'rgba(83,58,253,.22)'}
          />
        )
      })}
    </svg>
  )
}

// ─── Delta badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums text-neutral-500"
        style={{ background: 'rgba(100,116,141,.10)' }}
      >
        <Minus size={9} aria-hidden />
        без изменений
      </span>
    )
  }
  const positive = delta > 0
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums"
      style={
        positive
          ? { background: 'rgba(0,178,97,.10)', color: '#006d3d' }
          : { background: 'rgba(216,53,30,.08)', color: '#b02010' }
      }
    >
      {positive
        ? <TrendingUp size={9} aria-hidden />
        : <TrendingDown size={9} aria-hidden />
      }
      {positive ? '+' : ''}{delta} к пред. периоду
    </span>
  )
}

// ─── Channel row ──────────────────────────────────────────────────────────────

const CH_META = {
  website:  { label: 'Сайт',     Icon: Globe,  color: '#533afd' },
  email:    { label: 'Email',     Icon: Mail,   color: '#007840' },
  telegram: { label: 'Telegram',  Icon: Send,   color: '#0088cc' },
} as const

function ChannelBreakdown({ channels, total }: {
  channels: Record<string, number>
  total: number
}) {
  const entries = Object.entries(CH_META)
    .map(([key, meta]) => ({ key, meta, count: channels[key] ?? 0 }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)

  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {entries.map(({ key, meta, count }) => {
        const { label, Icon, color } = meta
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={key} className="flex items-center gap-2">
            <Icon size={13} style={{ color }} aria-hidden />
            <span className="w-16 text-xs text-neutral-600">{label}</span>
            {/* Mini bar */}
            <div
              className="flex-1 overflow-hidden rounded-full"
              style={{ height: 5, background: 'rgba(83,58,253,.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color, opacity: 0.75 }}
              />
            </div>
            <span className="w-6 text-right text-xs font-semibold tabular-nums text-neutral-990">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function InboundEmptyState() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div
        className="mb-3 flex size-12 items-center justify-center rounded-full"
        style={{ background: 'rgba(83,58,253,.07)' }}
      >
        <ArrowUpRight size={20} className="text-brand-600" aria-hidden />
      </div>
      <p className="text-sm font-medium text-neutral-900">
        Пока нет обращений
      </p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-neutral-500">
        Повысьте полноту профиля и Trust Score, чтобы попасть выше в каталоге
      </p>
      <Link
        href="/submit"
        className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors"
        style={{ background: 'rgba(83,58,253,.08)', border: '1px solid rgba(83,58,253,.18)' }}
      >
        Подать данные
        <ArrowUpRight size={11} aria-hidden />
      </Link>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function DashboardInbound({ participantId, tier }: Props) {
  const [stats, setStats] = useState<InboundStats | null>(null)

  useEffect(() => {
    // Run client-side only (localStorage)
    setStats(readInboundStats(participantId))
  }, [participantId])

  const isEmpty = stats !== null && stats.count30d === 0

  const insight = tier ? tierInsight(tier) : ''

  return (
    <section
      className="rounded-2xl border border-border bg-white p-5 shadow-stripe-xs"
      aria-label="Поток обращений"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-990">
            Поток обращений
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Только агрегаты — без персональных данных
          </p>
        </div>
        {stats && !isEmpty && (
          <DeltaBadge delta={stats.delta30d} />
        )}
      </div>

      {/* Loading shimmer */}
      {stats === null && (
        <div className="flex flex-col gap-3">
          <div className="animate-shimmer h-8 w-3/4 rounded-lg" />
          <div className="animate-shimmer h-5 w-1/2 rounded" />
          <div className="animate-shimmer h-8 w-full rounded-lg" />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && <InboundEmptyState />}

      {/* Data */}
      {stats && !isEmpty && (
        <div className="flex flex-col gap-5">
          {/* Counters row */}
          <div className="flex items-end gap-6">
            {/* 30d */}
            <div>
              <span className="tabular-nums text-3xl font-light leading-none tracking-display text-neutral-990">
                {stats.count30d}
              </span>
              <p className="mt-0.5 text-xs text-neutral-500">за 30 дней</p>
            </div>
            {/* Divider */}
            <div className="mb-1 h-8 w-px bg-neutral-50" />
            {/* 7d */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="tabular-nums text-2xl font-light leading-none tracking-display text-brand-600">
                  {stats.count7d}
                </span>
                <DeltaBadge delta={stats.delta7d} />
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">за 7 дней</p>
            </div>
          </div>

          {/* Sparkline + label */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">
                последние 30 дней
              </span>
              <span className="text-[11px] text-brand-600">
                ▪ последние 7 дней
              </span>
            </div>
            <Sparkline daily={stats.daily30d} />
          </div>

          {/* Channel breakdown */}
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-700">
              По каналам (30 д.)
            </p>
            <ChannelBreakdown channels={stats.channels} total={stats.count30d} />
          </div>

          {/* Insight */}
          {insight && (
            <div
              className="rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(83,58,253,.05)', border: '1px solid rgba(83,58,253,.12)' }}
            >
              <p className="text-xs leading-relaxed" style={{ color: '#2e2b8c' }}>
                {insight}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
