'use client'

import Link from 'next/link'
import { AlertTriangle, Info, XCircle, CheckCircle2 } from 'lucide-react'
import type { ParticipantProfile, Flag, FlagSeverity } from '@/lib/profile-data'
import { TierPill, ProvisionalPill } from '@/components/catalog/tier-pill'
import { INCIDENTS_BY_PARTICIPANT } from '@/lib/incidents-data'
import { CounterpartyChain } from '@/components/profile/counterparty-chain'

// ─── Flag severity config ────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<
  FlagSeverity,
  { icon: React.ElementType; bg: string; border: string; text: string; badge: string; badgeText: string }
> = {
  INFO: {
    icon: Info,
    bg: 'rgba(83,58,253,.05)',
    border: 'rgba(83,58,253,.18)',
    text: '#273951',
    badge: 'rgba(83,58,253,.10)',
    badgeText: '#3a28c0',
  },
  WARNING: {
    icon: AlertTriangle,
    bg: 'rgba(201,162,39,.07)',
    border: 'rgba(201,162,39,.28)',
    text: '#273951',
    badge: 'rgba(201,162,39,.14)',
    badgeText: '#8a6800',
  },
  CRITICAL: {
    icon: XCircle,
    bg: 'rgba(216,53,30,.06)',
    border: 'rgba(216,53,30,.22)',
    text: '#273951',
    badge: 'rgba(216,53,30,.10)',
    badgeText: '#b02010',
  },
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Открыт',
  RESOLVED: 'Устранён',
  MONITORING: 'Мониторинг',
}

// Уровень нарушения — по-русски, вместо INFO/WARNING/CRITICAL
const SEVERITY_LABELS: Record<FlagSeverity, string> = {
  INFO: 'Информация',
  WARNING: 'Предупреждение',
  CRITICAL: 'Критично',
}

// Человеческие подписи уровня проверки компании
const KYB_OVERVIEW: Record<string, { label: string; hint: string }> = {
  L0: { label: 'Не проверена', hint: 'Заявка ещё не подана' },
  L1: { label: 'Базовая', hint: 'Подтверждено существование' },
  L2: { label: 'По документам', hint: 'Сверены документы' },
  L3: { label: 'Полная', hint: 'С бенефициарами и выездом' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

interface FlagItemProps {
  flag: Flag
  participantId: string
}

function FlagItem({ flag, participantId }: FlagItemProps) {
  const cfg = SEVERITY_CONFIG[flag.severity]
  const Icon = cfg.icon

  // Check if there's a matching incident in the log for this flag
  const incidentId = `inc-${participantId}-${flag.id}`
  const hasIncident = (INCIDENTS_BY_PARTICIPANT[participantId] ?? [])
    .some(inc => inc.id === incidentId)

  return (
    <div
      className="flex gap-3 rounded-xl p-4"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon
        size={16}
        className="mt-0.5 flex-shrink-0"
        style={{ color: cfg.badgeText }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity */}
          <span
            className="rounded-full px-2 py-px text-[11px] font-semibold"
            style={{ background: cfg.badge, color: cfg.badgeText }}
          >
            {SEVERITY_LABELS[flag.severity]}
          </span>
          {/* Status */}
          <span
            className="ml-auto rounded-full px-2 py-px text-[11px]"
            style={{
              background: flag.status === 'RESOLVED'
                ? 'rgba(0,178,97,.10)'
                : 'rgba(100,116,141,.10)',
              color: flag.status === 'RESOLVED' ? '#006d3d' : '#505a61',
            }}
          >
            {STATUS_LABELS[flag.status] ?? flag.status}
          </span>
        </div>
        <p className="mt-1.5 text-sm" style={{ color: cfg.text }}>
          {flag.message}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="text-[11px] text-muted-foreground">
            {formatDate(flag.raised_at)}
          </p>
          {hasIncident && (
            <Link
              href={`/incidents#inc-${incidentId}`}
              className="text-[11px] font-medium hover:underline"
              style={{ color: '#533afd' }}
            >
              Открыть в логе инцидентов →
            </Link>
          )}
          {flag.status !== 'RESOLVED' && (
            <Link
              href={`/appeals/new?subject=${participantId}&flag=${flag.id}`}
              className="text-[11px] font-medium hover:underline"
              style={{ color: '#b02010' }}
            >
              Оспорить →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

interface TabOverviewProps {
  profile: ParticipantProfile
}

export function TabOverview({ profile }: TabOverviewProps) {
  const isProvisional = profile.status === 'PROVISIONAL'
  const topFactors = [...profile.factors]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)

  return (
    <div className="space-y-6">

      {/* Provisional notice */}
      {isProvisional && profile.provisional_reason && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(201,162,39,.07)',
            border: '1px solid rgba(201,162,39,.28)',
          }}
        >
          <div className="flex gap-3">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="mb-1 text-sm font-semibold text-foreground">
                Оценка ещё не рассчитана — данные собираются
              </p>
              <p className="text-sm text-muted-foreground">
                {profile.provisional_reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two-column summary grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Trust Score */}
        <div className="rounded-xl border border-border bg-white p-4 shadow-stripe-xs">
          <p className="mb-1 text-xs text-muted-foreground">Trust Score</p>
          {isProvisional ? (
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-mono text-2xl font-semibold text-muted-foreground">—</span>
              <ProvisionalPill />
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="tabular-nums font-mono text-2xl font-semibold text-foreground">
                {profile.score?.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          )}
        </div>

        {/* Tier */}
        <div className="rounded-xl border border-border bg-white p-4 shadow-stripe-xs">
          <p className="mb-1 text-xs text-muted-foreground">Уровень доверия</p>
          <TierPill tier={profile.tier} size="md" />
          {profile.trust_ceiling < 100 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Лимит оценки: {profile.trust_ceiling}
            </p>
          )}
        </div>

        {/* Tests count */}
        <div className="rounded-xl border border-border bg-white p-4 shadow-stripe-xs">
          <p className="mb-1 text-xs text-muted-foreground">Независимых тестов</p>
          <span className="tabular-nums font-mono text-2xl font-semibold text-foreground">
            {profile.tests_count}
          </span>
        </div>

        {/* Проверка компании */}
        <div className="rounded-xl border border-border bg-white p-4 shadow-stripe-xs">
          <p className="mb-1 text-xs text-muted-foreground">Проверка компании</p>
          <span className="text-lg font-semibold text-foreground">
            {(KYB_OVERVIEW[profile.kyb_level] ?? KYB_OVERVIEW.L0).label}
          </span>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {(KYB_OVERVIEW[profile.kyb_level] ?? KYB_OVERVIEW.L0).hint}
          </p>
        </div>
      </div>

      {/* Top factors snapshot (if any) */}
      {topFactors.length > 0 && (
        <div className="rounded-xl border border-border bg-white shadow-stripe-xs">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Сильные стороны
            </h3>
            <p className="text-xs text-muted-foreground">
              Три признака с наибольшим вкладом в оценку
            </p>
          </div>
          <div className="divide-y divide-border">
            {topFactors.map((f) => (
              <div key={f.code} className="flex items-center gap-4 px-4 py-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: '#533afd' }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">
                  {f.label}
                </span>
                {/* Mini progress */}
                <div className="flex w-24 items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(83,58,253,.10)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${f.value}%`, background: '#533afd' }}
                    />
                  </div>
                  <span className="tabular-nums font-mono text-xs font-semibold text-foreground">
                    {f.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Supply-chain / counterparties ───────────────────────── */}
      <CounterpartyChain participantId={profile.id} />

      {/* ── Flags block ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-white shadow-stripe-xs">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Нарушения и предупреждения</h3>
            <p className="text-xs text-muted-foreground">
              Что зафиксировано по компании
            </p>
          </div>
          {profile.flags.length > 0 && (
            <span
              className="tabular-nums rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'rgba(216,53,30,.10)', color: '#b02010' }}
            >
              {profile.flags.length}
            </span>
          )}
        </div>

        <div className="p-4">
          {profile.flags.length === 0 ? (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <CheckCircle2 size={16} className="flex-shrink-0" style={{ color: '#00b261' }} />
              <span>Нарушений не зафиксировано</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {profile.flags.map((flag) => (
                <FlagItem key={flag.id} flag={flag} participantId={profile.id} />
              ))}
            </div>
          )}
        </div>

        {/* Micro-disclaimer on flags block */}
        {/* TODO: на ревью юриста */}
        <div
          className="flex items-start gap-2 border-t border-border px-4 py-2.5"
          style={{ background: 'rgba(248,250,253,.8)' }}
        >
          <svg className="mt-0.5 shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#95a4ba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-[11px] leading-relaxed" style={{ color: '#95a4ba' }}>
            Информационная оценка, не обвинение.{' '}
            Флаги отражают задокументированные данные, а не юридические выводы.{' '}
            <a href="/legal/disclaimer" className="underline hover:no-underline" style={{ color: '#7d8ba4' }}>
              Отказ от ответственности
            </a>
            {' · '}
            <a href="/appeals/new" className="underline hover:no-underline" style={{ color: '#7d8ba4' }}>
              Оспорить
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
