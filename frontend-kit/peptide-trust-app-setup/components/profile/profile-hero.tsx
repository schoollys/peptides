'use client'

import { useState } from 'react'
import { Shield, CheckCircle2, Building2, ExternalLink, AlertTriangle } from 'lucide-react'
import { TierPill, ProvisionalPill } from '@/components/catalog/tier-pill'
import { Button } from '@/components/ui/button'
import { ContactDrawer } from '@/components/profile/contact-drawer'
import { cn } from '@/lib/utils'
import type { ParticipantProfile } from '@/lib/profile-data'
import { ROLE_LABELS, FACTOR_LABELS, isUnverifiedSourceRole } from '@/lib/catalog-data'

// Уровень проверки компании (KYB) — человеческими словами, без кодов L0–L3
const KYB_CONFIG: Record<string, { label: string; title: string; bg: string; text: string; border: string }> = {
  L0: { label: 'Компания не проверена', title: 'Заявка на проверку ещё не подана', bg: 'rgba(216,53,30,.08)',  text: '#b02010', border: 'rgba(216,53,30,.25)' },
  L1: { label: 'Базовая проверка',       title: 'Подтверждено существование компании', bg: 'rgba(201,162,39,.10)', text: '#8a6800', border: 'rgba(201,162,39,.28)' },
  L2: { label: 'Проверка по документам', title: 'Сверены учредительные документы и лицензии', bg: 'rgba(0,178,97,.10)',   text: '#006d3d', border: 'rgba(0,178,97,.28)' },
  L3: { label: 'Полная проверка',        title: 'Проверка с подтверждением бенефициаров и выездом', bg: 'rgba(83,58,253,.10)',  text: '#3a28c0', border: 'rgba(83,58,253,.28)' },
}

/** Человеческий вердикт для шапки профиля — одна понятная строка. */
function verdictText(p: ParticipantProfile): string {
  if (p.status === 'PROVISIONAL') {
    return 'Новый участник — данные ещё собираются. Оценка появится после первых независимых проверок.'
  }

  let level: string
  switch (p.tier) {
    case 'Platinum':
    case 'Gold':
      level = 'Высокий уровень доверия.'
      break
    case 'Silver':
      level = 'Средний уровень доверия.'
      break
    case 'Bronze':
      level = 'Базовый уровень доверия.'
      break
    case 'Watch':
      level = 'Есть зафиксированные нарушения — проверьте компанию перед сделкой.'
      break
    default:
      level = 'Оценка доверия рассчитана по проверяемым данным.'
  }

  const strength = p.is_balanced
    ? 'Ровный профиль без слабых мест.'
    : p.dominant_factor
      ? `Сильная сторона — ${FACTOR_LABELS[p.dominant_factor].toLowerCase()}.`
      : ''

  return [level, strength].filter(Boolean).join(' ')
}

interface ProfileHeroProps {
  profile: ParticipantProfile
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  const kyb = KYB_CONFIG[profile.kyb_level] ?? KYB_CONFIG['L0']
  const isProvisional = profile.status === 'PROVISIONAL'
  const isWatch       = profile.tier === 'Watch' && !isProvisional
  const dominantLabel = profile.dominant_factor
    ? FACTOR_LABELS[profile.dominant_factor]
    : null

  const [contactOpen, setContactOpen] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-stripe-sm">
      {/* Gradient mesh — top-right corner accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(55% 65% at 95% 0%,   rgba(127,125,252,.13) 0%, transparent 55%)',
            'radial-gradient(40% 50% at 100% 35%,  rgba(244,75,204,.08) 0%, transparent 50%)',
            'radial-gradient(35% 45% at 85% 15%,   rgba(255,97,24,.06)  0%, transparent 45%)',
          ].join(', '),
        }}
      />

      <div className="relative px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

          {/* ── Left: identity ─────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Role icon + name */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'rgba(83,58,253,.10)', color: '#533afd' }}
              >
                <Building2 size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {profile.display_name}
                </h1>
              </div>
            </div>

            {/* Role · jurisdiction · domain */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {ROLE_LABELS[profile.role_code]}
              </span>
              <span className="text-border">·</span>
              <span>{profile.jurisdiction}</span>
              <span className="text-border">·</span>
              <a
                href={`https://${profile.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 transition-colors hover:text-primary"
              >
                {profile.domain}
                <ExternalLink size={11} className="ml-0.5 opacity-60" />
              </a>
            </div>

            {/* Человеческий вердикт — главное, что должен понять посетитель */}
            <p className="max-w-xl text-[15px] leading-relaxed text-foreground/90">
              {verdictText(profile)}
            </p>

            {/* Реселлер: источник не верифицирован — потолок тира до Vᵢ-пропагации (V1) */}
            {isUnverifiedSourceRole(profile.role_code) && !isProvisional && (
              <div
                className="flex max-w-xl items-start gap-2 rounded-lg px-3 py-2 text-[13px] leading-snug"
                style={{
                  background: 'rgba(201,162,39,.08)',
                  color: '#7a5c00',
                  border: '1px solid rgba(201,162,39,.25)',
                }}
              >
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" aria-hidden />
                <span>
                  Реселлер: оценка опирается на собственные данные продавца — источник
                  поставки ещё не верифицирован независимо. До запуска проверки цепочки
                  (Vᵢ-пропагация) тир ограничен уровнем <strong>Gold</strong>.
                </span>
              </div>
            )}

            {/* Status row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Уровень проверки компании */}
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: kyb.bg, color: kyb.text, border: `1px solid ${kyb.border}` }}
                title={kyb.title}
              >
                {kyb.label}
              </span>

              {/* Юридический статус */}
              {profile.verified_legal && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: 'rgba(0,178,97,.10)',
                    color: '#006d3d',
                    border: '1px solid rgba(0,178,97,.28)',
                  }}
                  title="Юридический статус компании подтверждён"
                >
                  <CheckCircle2 size={11} />
                  Юр. статус подтверждён
                </span>
              )}

              {/* Проверка подлинности записи */}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 gap-1 px-2.5 text-xs text-muted-foreground hover:text-primary md:ml-0"
                asChild
              >
                <a href="#integrity">
                  Проверить подлинность ↗
                </a>
              </Button>
            </div>
          </div>

          {/* ── Right: Trust badge ─────────────────────────────── */}
          <div className="flex flex-shrink-0 flex-col items-end gap-2 md:items-end">
            <div
              className="flex flex-col items-end gap-2 rounded-xl px-5 py-4 md:items-center"
              style={{
                background: 'rgba(248,250,253,.9)',
                border: '1px solid rgba(212,222,233,.7)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {/* Score number */}
              <div className="flex items-baseline gap-2">
                {isProvisional ? (
                  <span
                    className="tabular-nums font-mono text-5xl font-semibold leading-none tracking-tight"
                    style={{ color: '#95a4ba' }}
                  >
                    —
                  </span>
                ) : (
                  <span
                    className="tabular-nums font-mono text-5xl font-semibold leading-none tracking-tight"
                    style={{ color: '#1a2c44' }}
                  >
                    {profile.score?.toFixed(1)}
                  </span>
                )}
                <span className="text-sm font-normal text-muted-foreground">/ 100</span>
              </div>

              {/* Tier pill or provisional */}
              <div className="flex items-center gap-1.5">
                {isProvisional ? (
                  <ProvisionalPill />
                ) : (
                  <TierPill tier={profile.tier} size="md" />
                )}
                {profile.trust_ceiling < 100 && (
                  <span
                    className="text-xs text-muted-foreground"
                    title="Максимальная оценка до прохождения полной проверки"
                  >
                    лимит оценки {profile.trust_ceiling}
                  </span>
                )}
              </div>

              {/* Сильная сторона / ровный профиль */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield size={11} className="flex-shrink-0" />
                {isProvisional ? (
                  <span>данные собираются</span>
                ) : profile.is_balanced ? (
                  <span>Ровный профиль</span>
                ) : dominantLabel ? (
                  <span>
                    Сильная сторона:{' '}
                    <span className="font-medium text-foreground/70">
                      {dominantLabel}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>

              {/* Tests + update meta under badge */}
              <p className="text-right text-xs text-muted-foreground">
                {profile.tests_count} независимых тестов · обновлено {profile.updated_days_ago}д назад
              </p>

              {/* Score footnote → /trust-model */}
              <a
                href="/trust-model"
                className="text-right text-[11px] transition-colors hover:text-primary"
                style={{ color: '#95a4ba' }}
                title="Как рассчитывается Trust Score и что он означает"
              >
                Как считается и что это значит →
              </a>
          </div>

        </div>

        {/* ── CTA row ──────────────────────────────────────────── */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-5" style={{ borderColor: 'rgba(212,222,233,.5)' }}>
          {/* Primary CTA */}
          <Button
            className="gap-1.5 rounded-[10px] font-medium"
            style={{ background: '#533afd', color: 'white', paddingLeft: '1rem', paddingRight: '1rem' }}
            onClick={() => setContactOpen(true)}
          >
            Связаться с участником
            {/* Status warning badge inline */}
            {isWatch && (
              <span
                className="ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold"
                style={{ background: '#b3261e', color: 'white' }}
              >
                <AlertTriangle size={9} aria-hidden />
                Флаги
              </span>
            )}
            {isProvisional && (
              <span
                className="ml-1 inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-semibold"
                style={{ background: 'rgba(255,255,255,.22)', color: 'white' }}
              >
                данные собираются
              </span>
            )}
          </Button>

          {/* Secondary CTA */}
          <Button
            variant="ghost"
            asChild
            className="gap-1.5 rounded-[10px] font-medium"
            style={{ color: '#64748d', border: '1px solid rgba(212,222,233,.7)' }}
          >
            <a href={`/report?participant=${profile.id}`}>
              Сообщить о нарушении
            </a>
          </Button>
        </div>
      </div>

      {/* Contact drawer */}
      <ContactDrawer
        participant={profile}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </div>
  )
}
