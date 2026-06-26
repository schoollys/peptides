'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  EmptyState,
  LoadingState,
  ErrorState,
  ProvisionalState,
  CardSkeleton,
  PanelSkeleton,
  TableSkeleton,
  HeroSkeleton,
  BadgeSkeleton,
} from '@/components/states'

// ---- Section wrapper ----
function Section({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e5edf5]" />
        <span className="shrink-0 rounded-full border border-[#e5edf5] bg-white px-3 py-0.5 text-xs font-medium text-[#64748d] shadow-[0_2px_10px_0_rgba(0,55,112,.06)]">
          {label}
        </span>
        <div className="h-px flex-1 bg-[#e5edf5]" />
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

// ---- Sub-section label ----
function Sub({ label, note }: { label: string; note?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <p className="text-sm font-medium text-[#3c4f69]">{label}</p>
      {note && <span className="text-xs text-[#95a4ba]">{note}</span>}
    </div>
  )
}

// ---- Sticky nav ----
const NAV = [
  { id: 'empty',       label: 'EmptyState' },
  { id: 'loading',     label: 'LoadingState' },
  { id: 'error',       label: 'ErrorState' },
  { id: 'provisional', label: 'ProvisionalState' },
]

// ---- Inline catalog icon ----
function SearchIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="size-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  )
}
function ProfileIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="size-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0 1 12 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
  )
}
function FileIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="size-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    </svg>
  )
}

export default function StatesPage() {
  const [errorRetryCount, setErrorRetryCount] = useState(0)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Page hero */}
        <div className="border-b border-[#e5edf5] bg-white">
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#533afd]">Дизайн-система</p>
            <h1 className="text-[1.75rem] font-medium tracking-[-0.02em] text-[#061b31]">Состояния интерфейса</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#64748d]">
              Переиспользуемые компоненты-состояния на токенах Stripe Helios.
              Доступность: <code className="rounded bg-[#e8e9ff] px-1 py-0.5 text-xs text-[#533afd]">aria-live</code>,
              {' '}<code className="rounded bg-[#e8e9ff] px-1 py-0.5 text-xs text-[#533afd]">aria-busy</code>,
              {' '}<code className="rounded bg-[#e8e9ff] px-1 py-0.5 text-xs text-[#533afd]">role=alert</code> — фокус-кольцо{' '}
              <code className="rounded bg-[#e8e9ff] px-1 py-0.5 text-xs font-mono text-[#533afd]">#635bff</code>.
            </p>

            {/* Sticky anchor nav */}
            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Разделы страницы">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="rounded-full border border-[#e5edf5] bg-white px-3 py-1 text-xs font-medium text-[#50617a] shadow-[0_2px_10px_0_rgba(0,55,112,.06)] transition-colors hover:border-[#b9b9f9] hover:text-[#533afd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]/50"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-5xl space-y-14 px-5 py-12 sm:px-8">

          {/* ── EmptyState ─────────────────────────────────────────── */}
          <Section id="empty" label="EmptyState">
            <Sub label="Каталог без результатов" note="variant=search" />
            <EmptyState
              icon={<SearchIcon />}
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры — тир, роль или доминирующий фактор."
              variant="search"
              action={{ label: 'Сбросить фильтры', variant: 'outline', onClick: () => {} }}
              compact
            />

            <Sub label="Профиль не заявлен" note="variant=unclaimed" />
            <EmptyState
              icon={<ProfileIcon />}
              title="Профиль не заявлен"
              description="Этот участник ещё не прошёл верификацию. Вы можете заявить профиль и начать процедуру KYB."
              variant="unclaimed"
              action={{ label: 'Заявить профиль', href: '/claim' }}
              secondaryAction={{ label: 'Подробнее о верификации', variant: 'ghost', onClick: () => {} }}
              compact
            />

            <Sub label="Нет активных флагов" note="variant=default, compact" />
            <EmptyState
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} className="size-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
              title="Нет активных флагов"
              description="Все флаги закрыты или отозваны."
              variant="default"
              compact
            />

            <Sub label="Нет исторических данных" note="variant=default" />
            <EmptyState
              icon={<FileIcon />}
              title="История пуста"
              description="Снимки Score появятся здесь после первого пересчёта алгоритма."
              variant="default"
              action={{ label: 'Подать данные', href: '/submit' }}
            />
          </Section>

          {/* ── LoadingState ───────────────────────────────────────── */}
          <Section id="loading" label="LoadingState">
            <Sub label="Скелетоны карточек" note="variant=cards, count=3" />
            <LoadingState variant="cards" count={3} />

            <Sub label="Скелетон панели" note="variant=panel" />
            <LoadingState variant="panel" />

            <Sub label="Скелетон таблицы" note="variant=table, rows=4" />
            <LoadingState variant="table" count={4} />

            <Sub label="Hero (профиль / dashboard)" note="variant=hero" />
            <LoadingState variant="hero" />

            <Sub label="Badge из кэша (мгновенно)" note="variant=badge — ETag, signed SVG" />
            <div className="flex flex-col gap-3">
              <LoadingState variant="badge" label="Загрузка бейджа…" />
              <p className="text-xs text-[#95a4ba] leading-relaxed max-w-md">
                Score-бейдж отдаётся из подписанного кэша с ETag — без задержки, даже при деградации
                вычислительного сервиса. Мерцание скелетона здесь лишь для демонстрации.
              </p>
            </div>

            <Sub label="Отдельные примитивы" />
            <div className="grid gap-4 sm:grid-cols-2">
              <CardSkeleton />
              <PanelSkeleton />
            </div>
            <TableSkeleton rows={3} />
          </Section>

          {/* ── ErrorState ─────────────────────────────────────────── */}
          <Section id="error" label="ErrorState">
            <Sub label="Стандартная ошибка с request_id" note="severity=default" />
            <ErrorState
              title="Не удалось загрузить данные · Повторить"
              description="Сервер вернул неожиданный ответ. Попробуйте обновить страницу или обратитесь в поддержку, указав request_id."
              requestId="req_2Yv8K3mNpQxLwD4cT9aF"
              severity="default"
              onRetry={() => setErrorRetryCount((c) => c + 1)}
            />
            {errorRetryCount > 0 && (
              <p className="text-xs text-[#533afd] tabular-nums">
                Повторных попыток: {errorRetryCount}
              </p>
            )}

            <Sub label="Деградация внешнего сервиса" note="severity=degraded, isDegradation=true" />
            <ErrorState
              title="Временная недоступность сервиса верификации"
              description="Внешний KYB-провайдер не отвечает. Данные с последнего снимка остаются актуальными."
              requestId="req_9Aa1BcDeFgHiJkLm"
              severity="degraded"
              isDegradation
              onRetry={() => {}}
            />

            <Sub label="Критическая ошибка (500)" note="severity=critical" />
            <ErrorState
              title="Внутренняя ошибка сервера"
              description="Пересчёт Score прерван. Инженеры уведомлены автоматически."
              requestId="req_CRITICAL_0xdeadbeef"
              severity="critical"
              onRetry={() => {}}
            />

            <Sub label="Компактный (без retry, встроен в панель)" />
            <ErrorState
              title="Не удалось загрузить историю"
              requestId="req_compact_001"
              compact
            />
          </Section>

          {/* ── ProvisionalState ───────────────────────────────────── */}
          <Section id="provisional" label="ProvisionalState">
            <Sub label="Новый профиль — накопление" note="variant=new" />
            <ProvisionalState
              displayName="NovaBio Analytics AG"
              variant="new"
              testsAccumulated={1}
              testsRequired={5}
              reasons={[
                { label: 'KYB L1 пройден', met: true },
                { label: 'Минимум 5 независимых тестов', met: false },
                { label: 'Подтверждённый оракул-источник', met: false },
                { label: 'Нет активных флагов CRITICAL', met: true },
              ]}
              onSubmitData={() => {}}
              onViewProfile={() => {}}
            />

            <Sub label="Provisional — порог близко" note="variant=provisional" />
            <ProvisionalState
              displayName="Delta Peptide Labs"
              variant="provisional"
              testsAccumulated={4}
              testsRequired={5}
              reasons={[
                { label: 'KYB L2 пройден', met: true },
                { label: 'Минимум 5 независимых тестов', met: false },
                { label: 'Отсутствие флагов WARNING+', met: true },
              ]}
              onSubmitData={() => {}}
            />

            <Sub label="Репутационная заметка" note="variant=rep-note" />
            <ProvisionalState
              displayName="AlphaSource KG"
              variant="rep-note"
              testsAccumulated={0}
              testsRequired={5}
              onViewProfile={() => {}}
            />

            <Sub label="Компактный (inline в карточке каталога)" note="compact=true" />
            <div className="max-w-sm">
              <ProvisionalState
                displayName="OrionPharma AG"
                variant="provisional"
                testsAccumulated={2}
                testsRequired={5}
                compact
              />
            </div>
          </Section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
