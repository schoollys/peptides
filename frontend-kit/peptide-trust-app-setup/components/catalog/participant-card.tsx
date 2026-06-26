'use client'

import Link from 'next/link'
import { ShieldCheck, Check, Plus } from 'lucide-react'
import type { ParticipantSummary } from '@/lib/catalog-data'
import { ROLE_LABELS, FACTOR_LABELS, ANCHOR_ROLE_CODES } from '@/lib/catalog-data'
import { TierPill, ProvisionalPill } from '@/components/catalog/tier-pill'

interface ParticipantCardProps {
  participant: ParticipantSummary
  compareSelected?: boolean
  compareDisabled?: boolean
  onCompareToggle?: (id: string) => void
}

export function ParticipantCard({
  participant: p,
  compareSelected = false,
  compareDisabled = false,
  onCompareToggle,
}: ParticipantCardProps) {
  const isProvisional = p.status === 'PROVISIONAL'
  const isAnchorRole  = ANCHOR_ROLE_CODES.includes(p.role_code)

  const dominantLabel =
    !isProvisional && p.dominant_factor
      ? FACTOR_LABELS[p.dominant_factor]
      : null

  function handleCompareClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onCompareToggle?.(p.id)
  }

  return (
    <div className="group relative">
      <Link
        href={`/p/${p.id}`}
        className={`block rounded-[16px] bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          compareSelected
            ? 'border border-brand-600 ring-2 ring-brand-600 shadow-stripe-sm'
            : 'border border-neutral-100/60 shadow-stripe-sm hover:shadow-stripe-md'
        }`}
      >
        {/* Top row: name + role (reserve top-right space for the floating compare button) */}
        <div className="min-w-0 pr-28">
          <p
            className="truncate text-sm font-semibold leading-snug"
            style={{ color: '#061b31', letterSpacing: '-0.01em' }}
          >
            {p.display_name}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: '#64748d' }}>
            {ROLE_LABELS[p.role_code]}
          </p>
        </div>

        {/* Trust badge row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isProvisional ? (
            <ProvisionalPill />
          ) : (
            <>
              <span
                className="tabular-nums text-2xl font-bold leading-none"
                style={{
                  color: p.tier === 'Watch' ? '#b02010' : '#061b31',
                  letterSpacing: '-0.03em',
                }}
              >
                {p.score?.toFixed(1)}
              </span>
              <TierPill tier={p.tier} />
            </>
          )}

          {/* Verified-legal badge — перенесён сюда, чтобы не пересекаться с кнопкой сравнения */}
          {p.verified_legal && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-medium"
              style={{
                background: 'rgba(0,178,97,.10)',
                color:      '#00732e',
                border:     '1px solid rgba(0,178,97,.28)',
              }}
              title="Юридический статус компании подтверждён"
            >
              <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
              <span>Юр. статус</span>
            </span>
          )}
        </div>

        {/* Dominant factor */}
        <div className="mt-2.5">
          {isProvisional ? (
            <p className="text-xs" style={{ color: '#5b78a8' }}>
              данные собираются
            </p>
          ) : (
            <p className="text-xs" style={{ color: '#50617a' }}>
              {p.is_balanced || !dominantLabel
                ? 'Ровный профиль'
                : `Сильная сторона: ${dominantLabel}`}
            </p>
          )}
        </div>

        {/* Non-anchor MVP badge */}
        {!isAnchorRole && (
          <div className="mt-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: 'rgba(148,164,186,.10)',
                color:      '#64748d',
                border:     '1px solid rgba(148,164,186,.28)',
              }}
              title="Полная оценка для этой роли появится позже"
            >
              данные ещё собираются
            </span>
          </div>
        )}

        {/* Meta row */}
        <div
          className="mt-3 flex items-center gap-1.5 border-t pt-3 text-[11px]"
          style={{ borderColor: 'rgba(212,222,233,.6)', color: '#7d8ba4' }}
        >
          <span>{p.tests_count} независимых тестов</span>
          <span style={{ color: '#bac8da' }}>·</span>
          <span>обновлено {p.updated_days_ago}д назад</span>
          <span className="ml-auto truncate" style={{ color: '#bac8da' }}>
            {p.domain}
          </span>
        </div>
      </Link>

      {/* Compare toggle button — floats above the link */}
      {onCompareToggle && (
        <button
          onClick={handleCompareClick}
          disabled={compareDisabled && !compareSelected}
          aria-pressed={compareSelected}
          aria-label={compareSelected ? 'Убрать из сравнения' : 'Добавить в сравнение'}
          title={
            compareDisabled && !compareSelected
              ? 'Максимум 5 участников'
              : compareSelected
              ? 'Убрать из сравнения'
              : 'В сравнение'
          }
          className="absolute right-3 top-3 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all"
          style={{
            background: compareSelected ? '#533afd' : 'rgba(83,58,253,.08)',
            color:      compareSelected ? '#fff' : '#533afd',
            border:     `1px solid ${compareSelected ? '#533afd' : 'rgba(83,58,253,.25)'}`,
            opacity:    compareDisabled && !compareSelected ? 0.4 : 1,
            cursor:     compareDisabled && !compareSelected ? 'not-allowed' : 'pointer',
          }}
        >
          {compareSelected ? (
            <>
              <Check size={11} strokeWidth={2.5} />
              Выбран
            </>
          ) : (
            <>
              <Plus size={11} strokeWidth={2.5} />
              В сравнение
            </>
          )}
        </button>
      )}
    </div>
  )
}
