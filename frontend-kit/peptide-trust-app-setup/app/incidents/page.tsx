import Link from 'next/link'
import { ShieldCheck, AlertTriangle, XCircle, Info, ExternalLink } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { INCIDENTS } from '@/lib/incidents-data'
import type { Incident, IncidentSeverity, IncidentStatus } from '@/lib/incidents-data'

// ─── Severity config ─────────────────────────────────────────────────────────

const SEV: Record<IncidentSeverity, {
  icon: React.ElementType
  bg: string
  border: string
  badgeBg: string
  badgeText: string
  label: string
}> = {
  CRITICAL: {
    icon: XCircle,
    bg: 'rgba(216,53,30,.05)',
    border: 'rgba(216,53,30,.20)',
    badgeBg: 'rgba(179,38,30,.10)',
    badgeText: '#b3261e',
    label: 'CRITICAL',
  },
  WARNING: {
    icon: AlertTriangle,
    bg: 'rgba(201,162,39,.05)',
    border: 'rgba(201,162,39,.22)',
    badgeBg: 'rgba(201,162,39,.12)',
    badgeText: '#8a6800',
    label: 'WARNING',
  },
  INFO: {
    icon: Info,
    bg: 'rgba(83,58,253,.04)',
    border: 'rgba(83,58,253,.14)',
    badgeBg: 'rgba(83,58,253,.09)',
    badgeText: '#3a28c0',
    label: 'INFO',
  },
}

const STATUS_CFG: Record<IncidentStatus, { label: string; bg: string; color: string }> = {
  open:      { label: 'Открыт',     bg: 'rgba(216,53,30,.08)',    color: '#b02010' },
  upheld:    { label: 'Подтверждён', bg: 'rgba(201,162,39,.10)',   color: '#8a6800' },
  dismissed: { label: 'Отклонён',   bg: 'rgba(0,178,97,.08)',     color: '#006d3d' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Single incident row ─────────────────────────────────────────────────────

function IncidentRow({ inc }: { inc: Incident }) {
  const sev = SEV[inc.severity]
  const Icon = sev.icon
  const st  = STATUS_CFG[inc.status]

  return (
    <div
      id={`inc-${inc.id}`}
      className="flex gap-3.5 rounded-xl p-4 transition-colors"
      style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
    >
      {/* Severity icon */}
      <Icon
        size={16}
        className="mt-0.5 flex-shrink-0"
        style={{ color: sev.badgeText }}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity badge */}
          <span
            className="rounded-full px-2 py-px text-[11px] font-bold tracking-wide"
            style={{ background: sev.badgeBg, color: sev.badgeText }}
          >
            {sev.label}
          </span>

          {/* Violation type */}
          <span className="text-xs font-medium" style={{ color: '#061b31' }}>
            {inc.violation_type}
          </span>

          {/* Status pill */}
          <span
            className="ml-auto rounded-full px-2 py-px text-[11px] font-medium"
            style={{ background: st.bg, color: st.color }}
          >
            {st.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed" style={{ color: '#273951' }}>
          {inc.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: '#64748d' }}>
          {/* Participant link */}
          <Link
            href={`/p/${inc.participant_id}`}
            className="font-medium hover:underline"
            style={{ color: '#533afd' }}
          >
            {inc.participant_name}
          </Link>

          {/* Date */}
          <span>{formatDate(inc.raised_at)}</span>

          {/* Anchor hash */}
          {inc.anchor_hash !== '—' && (
            <span className="font-mono">{inc.anchor_hash}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const hasIncidents = INCIDENTS.length > 0

  return (
    <>
      <title>Лог инцидентов — PeptideTrust</title>
      <Header />
      <main className="min-h-screen" style={{ background: '#f8fafd' }}>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">

          {/* Page header */}
          <div className="mb-6">
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ color: '#061b31' }}
            >
              Лог инцидентов
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#64748d' }}>
              Публичный реестр нарушений с временными метками, отсортированный от новых к старым.
              Ни один инцидент не удаляется без публичного объяснения.
            </p>
          </div>

          {/* Immutability principle */}
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm leading-relaxed"
            style={{
              background: 'rgba(0,178,97,.07)',
              border: '1px solid rgba(0,178,97,.22)',
              color: '#005c37',
            }}
          >
            <span className="font-semibold">Принцип неизменяемости.</span>{' '}
            Каждый инцидент фиксируется с anchor-хэшем и временной меткой.
            Изменение записи требует публичного объяснения и пересчёта Trust Score.
          </div>

          {/* Stats strip */}
          {hasIncidents && (
            <div
              className="mb-6 flex flex-wrap gap-4 rounded-xl border border-border bg-white px-5 py-3.5 shadow-stripe-xs text-sm"
              style={{ color: '#273951' }}
            >
              <span>
                Всего:{' '}
                <strong className="font-semibold">{INCIDENTS.length}</strong>
              </span>
              {(['CRITICAL', 'WARNING', 'INFO'] as IncidentSeverity[]).map(s => {
                const count = INCIDENTS.filter(i => i.severity === s).length
                if (!count) return null
                const cfg = SEV[s]
                return (
                  <span key={s} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: cfg.badgeText }}
                    />
                    <span style={{ color: cfg.badgeText, fontWeight: 600 }}>{s}</span>
                    <span style={{ color: '#64748d' }}>× {count}</span>
                  </span>
                )
              })}
            </div>
          )}

          {/* Incident list */}
          {hasIncidents ? (
            <div className="space-y-3">
              {INCIDENTS.map(inc => (
                <IncidentRow key={inc.id} inc={inc} />
              ))}
            </div>
          ) : (
            /* Empty state fallback */
            <div
              className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center"
              style={{ borderColor: '#d4dee9' }}
              role="status"
              aria-label="Нет зарегистрированных инцидентов"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(0,178,97,.10)' }}
                aria-hidden="true"
              >
                <ShieldCheck className="h-6 w-6" style={{ color: '#00b261' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#061b31' }}>
                  Нет зарегистрированных инцидентов
                </p>
                <p className="mt-0.5 text-xs" style={{ color: '#64748d' }}>
                  Все участники реестра прошли проверку без выявленных нарушений.
                </p>
              </div>
            </div>
          )}

          {/* Footer row */}
          <div
            className="mt-6 flex items-center justify-between border-t pt-5"
            style={{ borderColor: '#e5edf5' }}
          >
            <p className="text-xs" style={{ color: '#95a4ba' }}>
              Обновлено автоматически · {INCIDENTS.length} записей
            </p>
            <Link
              href="/report"
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: '#533afd' }}
            >
              Сообщить о нарушении →
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
