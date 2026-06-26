'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, ArrowRight, ShieldCheck } from 'lucide-react'
import { TierPill } from '@/components/catalog/tier-pill'
import type { MyProfile } from '@/lib/dashboard-data'
import { FACTOR_LABELS } from '@/lib/catalog-data'
import { Button } from '@/components/ui/button'

interface Props {
  profile: MyProfile
}

export function DashboardScoreHero({ profile }: Props) {
  const delta = profile.score - profile.score_prev
  const trendUp = delta > 0.05
  const trendDown = delta < -0.05

  // KYB level colour
  const kybColour: Record<string, { bg: string; text: string; border: string }> = {
    L0: { bg: 'rgba(216,53,30,.10)',   text: '#b02010', border: 'rgba(216,53,30,.28)' },
    L1: { bg: 'rgba(201,162,39,.10)',  text: '#8a6800', border: 'rgba(201,162,39,.28)' },
    L2: { bg: 'rgba(0,178,97,.10)',    text: '#007840', border: 'rgba(0,178,97,.28)'   },
    L3: { bg: 'rgba(83,58,253,.10)',   text: '#2e2b8c', border: 'rgba(83,58,253,.28)'  },
  }
  const kyb = kybColour[profile.kyb_level] ?? kybColour.L0

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #0d253d 0%, #1a2c44 40%, #273951 70%, #1c1e54 100%)',
      }}
    >
      {/* Gradient mesh accent — top-right corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(55% 70% at 90% 0%, rgba(99,91,255,.28) 0%, transparent 60%)',
            'radial-gradient(40% 50% at 100% 30%, rgba(244,75,204,.18) 0%, transparent 55%)',
            'radial-gradient(35% 45% at 85% 55%, rgba(234,34,97,.12) 0%, transparent 50%)',
          ].join(', '),
        }}
      />

      {/* Fine grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative px-8 py-8 md:px-10 md:py-10">
        {/* Top row: label + status chips */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,.5)' }}>
            Мой Trust Score
          </span>
          {/* KYB pill */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: kyb.bg, color: kyb.text, border: `1px solid ${kyb.border}` }}
          >
            KYB {profile.kyb_level}
          </span>
          {/* Verified-Legal */}
          {profile.verified_legal && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(0,178,97,.12)', color: '#00e07a', border: '1px solid rgba(0,178,97,.25)' }}
            >
              <ShieldCheck size={11} />
              Verified-Legal
            </span>
          )}
          {/* Algo version */}
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px]"
            style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.45)', border: '1px solid rgba(255,255,255,.10)' }}
          >
            {profile.algo_version}
          </span>
        </div>

        {/* Main content: score left, meta right */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          {/* Score block */}
          <div className="flex items-end gap-5">
            {/* Big number */}
            <div>
              <span
                className="font-sans tabular-nums leading-none"
                style={{
                  fontSize: 'clamp(64px, 8vw, 96px)',
                  fontWeight: 300,
                  letterSpacing: '-0.04em',
                  color: '#ffffff',
                }}
              >
                {profile.score.toFixed(1)}
              </span>
              <span className="ml-1 text-sm font-light" style={{ color: 'rgba(255,255,255,.4)' }}>/ 100</span>
            </div>

            {/* Trend + delta */}
            <div className="mb-3 flex flex-col items-start gap-1.5">
              <TierPill tier={profile.tier} size="md" />
              <div
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                style={
                  trendUp
                    ? { background: 'rgba(0,178,97,.15)', color: '#00e07a', border: '1px solid rgba(0,178,97,.25)' }
                    : trendDown
                    ? { background: 'rgba(216,53,30,.15)', color: '#ff7060', border: '1px solid rgba(216,53,30,.25)' }
                    : { background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.5)', border: '1px solid rgba(255,255,255,.12)' }
                }
              >
                {trendUp ? <TrendingUp size={11} /> : trendDown ? <TrendingDown size={11} /> : <Minus size={11} />}
                {delta > 0 ? '+' : ''}{delta.toFixed(1)} за период
              </div>
            </div>
          </div>

          {/* Right meta */}
          <div className="flex flex-col gap-4 md:items-end">
            {/* Factor */}
            <div className="text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>
              {profile.is_balanced
                ? <span style={{ color: 'rgba(255,255,255,.7)' }}>Сбалансирован</span>
                : <>
                    <span style={{ color: 'rgba(255,255,255,.4)' }}>Преимущ. </span>
                    <span style={{ color: 'rgba(255,255,255,.85)' }} className="font-medium">
                      {profile.dominant_factor ? FACTOR_LABELS[profile.dominant_factor] : '—'}
                    </span>
                  </>
              }
            </div>
            {/* Trust ceiling */}
            <div className="text-sm" style={{ color: 'rgba(255,255,255,.4)' }}>
              Trust Ceiling
              <span className="ml-1.5 font-medium tabular-nums" style={{ color: 'rgba(255,255,255,.75)' }}>
                {profile.trust_ceiling}
              </span>
            </div>
            {/* CTA buttons */}
            <div className="flex gap-2">
              <Button
                asChild
                size="sm"
                className="border text-xs font-medium"
                style={{
                  background: 'rgba(255,255,255,.09)',
                  borderColor: 'rgba(255,255,255,.16)',
                  color: 'rgba(255,255,255,.85)',
                }}
              >
                <Link href={`/p/${profile.id}`}>Мой профиль</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-brand-600 text-xs font-medium"
                style={{
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,.18)',
                }}
              >
                <Link href="/submit">
                  Подать данные
                  <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom bar: updated + name */}
        <div
          className="mt-6 flex items-center justify-between border-t pt-4 text-xs"
          style={{ borderColor: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.35)' }}
        >
          <span className="font-medium" style={{ color: 'rgba(255,255,255,.6)' }}>
            {profile.display_name}
          </span>
          <span>Обновлено {profile.updated_days_ago}д назад</span>
        </div>
      </div>
    </div>
  )
}
