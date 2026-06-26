'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lightbulb } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { RequireAuth } from '@/components/auth/require-auth'
import { DashboardScoreHero } from '@/components/dashboard/dashboard-score-hero'
import { DashboardQuickCards } from '@/components/dashboard/dashboard-quick-cards'
import { DashboardAlerts } from '@/components/dashboard/dashboard-alerts'
import { DashboardInbound } from '@/components/dashboard/dashboard-inbound'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { ErrorBlock } from '@/components/states/error-block'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchDashboard } from '@/lib/dashboard-data'
import type { MyProfile, CounterpartyAlert } from '@/lib/dashboard-data'

// ─── Sub-navigation ───────────────────────────────────────────────────────
const SUB_NAV = [
  { label: 'Обзор',        href: '/dashboard' },
  { label: 'Подать данные', href: '/submit' },
  { label: 'Бейдж',        href: '/p/p-001/badge' },
]

function DashboardSubNav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex gap-6" aria-label="Разделы кабинета">
          {SUB_NAV.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center border-b-2 py-3 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-neutral-500'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

// ─── Score growth tips ────────────────────────────────────────────────────
function ScoreGrowthTips() {
  const tips = [
    {
      text: 'Загрузите подписанный COA от аккредитованного оракула',
      detail: 'Vᵢ = 1.0 — максимальный множитель верификации',
    },
    {
      text: 'Пригласите контрагентов через Chain Pull',
      detail: 'Повышение покрытия связей учитывается в факторе CCF',
    },
    {
      text: 'Завершите профиль',
      detail: 'Больше факторов учитывается в расчёте Trust Score',
    },
  ]

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-stripe-xs">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-brand-600"
          style={{ background: 'rgba(83,58,253,.08)' }}
        >
          <Lightbulb size={15} />
        </span>
        <h2 className="text-sm font-semibold text-neutral-990">
          Как повысить Score
        </h2>
      </div>
      <ol className="flex flex-col gap-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums text-brand-600"
              style={{ background: 'rgba(83,58,253,.10)' }}
            >
              {i + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-neutral-990">
                {tip.text}
              </span>
              <span className="text-xs text-neutral-500">
                {tip.detail}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────
function generateRequestId() {
  return 'req_' + Math.random().toString(36).slice(2, 10)
}

export default function DashboardPage() {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [alerts, setAlerts] = useState<CounterpartyAlert[]>([])
  const [requestId] = useState(() => generateRequestId())
  const [retryCount, setRetryCount] = useState(0)

  const loading = loadState === 'loading'

  useEffect(() => {
    setLoadState('loading')
    fetchDashboard()
      .then(({ profile, alerts }) => {
        setProfile(profile)
        setAlerts(alerts)
        setLoadState('loaded')
      })
      .catch(() => {
        setLoadState('error')
      })
  }, [retryCount])

  return (
    <>
      <title>Личный кабинет — PeptideTrust</title>
      <Header />
      <RequireAuth>
      <main className="min-h-screen bg-neutral-25">
        {/* Page header */}
        <div className="bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-heading text-neutral-990">
                  Личный кабинет
                </h1>
                <div className="mt-0.5 h-4">
                  {loading
                    ? <Skeleton className="h-4 w-40 rounded" />
                    : <p className="text-sm text-neutral-500">{profile?.display_name ?? ''}</p>
                  }
                </div>
              </div>
              {!loading && profile && (
                <span
                  className="hidden rounded-full px-3 py-1 text-xs font-medium text-brand-600 sm:inline-flex"
                  style={{
                    background: 'rgba(83,58,253,.07)',
                    border: '1px solid rgba(83,58,253,.15)',
                  }}
                >
                  {profile.id}
                </span>
              )}
            </div>
          </div>

          {/* Sub-navigation */}
          <DashboardSubNav />
        </div>

        {/* Body */}
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {loadState === 'error' ? (
            <ErrorBlock
              requestId={requestId}
              onRetry={() => setRetryCount(c => c + 1)}
            />
          ) : loading ? (
            <DashboardSkeleton />
          ) : profile ? (
            <div className="flex flex-col gap-8">
              {/* Dark navy score hero */}
              <DashboardScoreHero profile={profile} />

              {/* Inbound-flow card (ROI metric) */}
              <DashboardInbound
                participantId={profile.id}
                tier={profile.tier}
              />

              {/* Quick-action cards */}
              <DashboardQuickCards profile={profile} alerts={alerts} />

              {/* Score growth tips */}
              <ScoreGrowthTips />

              {/* Incomplete fields notice */}
              {profile.incomplete_fields.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'rgba(201,162,39,.05)',
                    border: '1px solid rgba(201,162,39,.20)',
                  }}
                >
                  <p className="mb-3 text-sm font-semibold text-gold-600">
                    Профиль не завершён — заполните, чтобы повысить Trust Ceiling
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.incomplete_fields.map(field => (
                      <span
                        key={field.key}
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-gold-600"
                        style={{
                          background: 'rgba(201,162,39,.10)',
                          border: '1px solid rgba(201,162,39,.22)',
                        }}
                      >
                        {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Counterparty alerts + always-visible BR-DAMPER */}
              <DashboardAlerts alerts={alerts} />
            </div>
          ) : null}
        </div>
      </main>
      </RequireAuth>
      <Footer />
    </>
  )
}
