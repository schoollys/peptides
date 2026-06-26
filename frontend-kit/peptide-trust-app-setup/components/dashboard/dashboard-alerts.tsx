'use client'

import Link from 'next/link'
import { AlertOctagon, ExternalLink, ChevronRight, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TierPill } from '@/components/catalog/tier-pill'
import type { CounterpartyAlert } from '@/lib/dashboard-data'
import { ACTION_LABELS, SEVERITY_CONFIG } from '@/lib/dashboard-data'

interface Props {
  alerts: CounterpartyAlert[]
}

// ─── Hard warning banner ──────────────────────────────────────────────────
function DamperWarningBanner() {
  return (
    <div
      className="flex gap-3 rounded-xl p-4"
      style={{
        background: 'rgba(216,53,30,.07)',
        border: '1px solid rgba(216,53,30,.22)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <AlertOctagon
        size={18}
        className="mt-px shrink-0 text-error"
        aria-hidden
      />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-error">
          Жёсткое предупреждение
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#7a2010' }}>
          Если продолжить сорсинг у флагнутого контрагента после алерта —
          30-дневный демпфер-буфер отменяется и Score пересчитывается вниз{' '}
          <strong>немедленно</strong>.
        </p>
      </div>
    </div>
  )
}

// ─── Single alert card ────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: CounterpartyAlert }) {
  const cfg = SEVERITY_CONFIG[alert.severity]

  // Format date
  const date = new Date(alert.raised_at)
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5 transition-shadow duration-150 hover:shadow-stripe-md"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {/* Top row: severity dot + name + tier + date */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Severity dot */}
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: cfg.dot }}
            title={cfg.label}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-neutral-990">
              {alert.counterparty_name}
            </span>
            <span
              className="rounded-full px-1.5 py-px text-[11px] font-medium"
              style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
            >
              {cfg.label}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TierPill tier={alert.counterparty_tier} size="sm" />
          <span className="text-xs text-neutral-500">{dateStr}</span>
          {alert.status === 'UNREAD' && (
            <span
              className="size-1.5 rounded-full bg-brand-600"
              title="Непрочитано"
            />
          )}
        </div>
      </div>

      {/* Title + detail */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-neutral-990">
          {alert.title}
        </p>
        <p className="text-xs leading-relaxed text-neutral-600">
          {alert.detail}
        </p>
      </div>

      {/* Score delta (if significant) */}
      {alert.score_delta !== 0 && (
        <div
          className="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium tabular-nums"
          style={{
            background: 'rgba(255,255,255,.55)',
            border: '1px solid rgba(0,55,112,.08)',
          }}
        >
          <span className="text-neutral-500">Score:</span>
          <span className="text-neutral-990" style={{ fontWeight: 600 }}>{alert.score_current}</span>
          <span
            className={alert.score_delta < 0 ? 'text-error' : 'text-success'}
            style={{ fontWeight: 600 }}
          >
            {alert.score_delta > 0 ? '+' : ''}{alert.score_delta.toFixed(1)}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {alert.suggested_actions.map(action => (
          <Button
            key={action}
            size="sm"
            variant={action === 'review_sourcing' ? 'default' : 'outline'}
            className={`text-xs ${action === 'review_sourcing' ? 'border-brand-600 bg-brand-600 text-white' : ''}`}
            style={action === 'review_sourcing' ? undefined : { borderColor: 'rgba(0,55,112,.15)' }}
            asChild={action !== 'open_appeal'}
          >
            {action === 'open_appeal' ? (
              <Link href="/appeals/new">
                {ACTION_LABELS[action]}
                <ExternalLink size={11} />
              </Link>
            ) : (
              <span className="flex cursor-pointer items-center gap-1">
                {ACTION_LABELS[action]}
                <ChevronRight size={11} />
              </span>
            )}
          </Button>
        ))}
        <Button size="sm" variant="ghost" asChild className="ml-auto text-xs">
          <Link href={`/p/${alert.counterparty_id}`} className="flex items-center gap-1">
            Профиль
            <ExternalLink size={11} />
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────
function EmptyAlerts() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl py-12"
      style={{ border: '1px dashed rgba(0,55,112,.14)', background: 'rgba(248,250,253,.7)' }}
    >
      <span
        className="flex size-10 items-center justify-center rounded-full text-success-600"
        style={{ background: 'rgba(0,178,97,.08)' }}
      >
        <Bell size={18} />
      </span>
      <p className="text-sm font-medium text-neutral-990">
        Нет активных алертов
      </p>
      <p className="text-xs text-neutral-500">
        Все контрагенты в норме — новые алерты появятся здесь
      </p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────
export function DashboardAlerts({ alerts }: Props) {
  const hasCritical = alerts.some(a => a.severity === 'CRITICAL')

  return (
    <section id="alerts" className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-990">
          Алерты контрагентов
          {alerts.length > 0 && (
            <span
              className={`ml-2 inline-flex size-5 items-center justify-center rounded-full text-xs font-bold tabular-nums text-white ${hasCritical ? 'bg-error' : 'bg-brand-600'}`}
            >
              {alerts.length}
            </span>
          )}
        </h2>
        <span className="text-xs text-neutral-500">
          Обновлено автоматически
        </span>
      </div>

      {/* BR-DAMPER hard warning — always visible per wireframes §08 / US-6.2 */}
      <DamperWarningBanner />

      {/* Alert list or empty */}
      {alerts.length === 0 ? (
        <EmptyAlerts />
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  )
}
