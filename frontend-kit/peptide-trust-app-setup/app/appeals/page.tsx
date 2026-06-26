'use client'

import Link from 'next/link'
import { Scale, Plus, ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AppealStatusTracker } from '@/components/appeals/appeal-status-tracker'
import { getFlagLabel, type Appeal } from '@/lib/appeals-data'
import { Button } from '@/components/ui/button'

// ─── Mock submitted appeals ───────────────────────────────────────────────
const MOCK_APPEALS: Appeal[] = [
  {
    id: 'APL-1003',
    subject_id: 'p-012',
    flag_id: 'f-1',
    flag_type: 'SCORE_DECLINE',
    statement: 'Score decline caused by outdated test data. New independent tests submitted.',
    status: 'in_review',
    submitted_at: '2026-06-03T09:14:00Z',
    request_id: 'req_ab3c9d1e',
    panel_ref: 'VRF-2026-017',
  },
  {
    id: 'APL-1002',
    subject_id: 'p-005',
    flag_id: 'f-1',
    flag_type: 'KYB_INCOMPLETE',
    statement: 'KYB documents submitted to notary and will be provided.',
    status: 'panel_forming',
    submitted_at: '2026-06-10T14:30:00Z',
    request_id: 'req_cd7f0a22',
  },
  {
    id: 'APL-1001',
    subject_id: 'p-010',
    flag_id: 'f-2',
    flag_type: 'KYB_MISSING',
    statement: 'Full KYB package uploaded including extract from state register.',
    status: 'decided',
    submitted_at: '2026-05-20T11:00:00Z',
    request_id: 'req_ef90b4d3',
    panel_ref: 'VRF-2026-011',
    decision: 'Upheld. KYB documents verified. Flag removed.',
  },
]

// ─── Status badge ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  submitted:     { label: 'Подана',            bg: 'rgba(83,58,253,.08)',    color: '#3a28c0' },
  panel_forming: { label: 'Формирование',      bg: 'rgba(201,162,39,.10)',   color: '#8a6800' },
  in_review:     { label: 'На рассмотрении',   bg: 'rgba(83,58,253,.10)',    color: '#533afd' },
  decided:       { label: 'Решение вынесено',  bg: 'rgba(0,178,97,.10)',     color: '#006d3d' },
  withdrawn:     { label: 'Отозвана',          bg: 'rgba(100,116,141,.10)',  color: '#505a61' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AppealRow({ appeal }: { appeal: Appeal }) {
  const st = STATUS_CONFIG[appeal.status] ?? STATUS_CONFIG.submitted

  return (
    <div
      className="rounded-2xl border bg-white p-5 flex flex-col gap-4 hover:shadow-stripe-md transition-shadow duration-150"
      style={{ borderColor: '#e5edf5' }}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold" style={{ color: '#061b31' }}>
              {appeal.id}
            </span>
            <span
              className="rounded-full px-2.5 py-px text-[11px] font-semibold"
              style={{ background: st.bg, color: st.color }}
            >
              {st.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#64748d' }}>
            <Link
              href={`/p/${appeal.subject_id}`}
              className="hover:underline font-medium"
              style={{ color: '#533afd' }}
            >
              {appeal.subject_id}
            </Link>
            <span>·</span>
            <span>{getFlagLabel(appeal.flag_type)}</span>
            <span>·</span>
            <span>{formatDate(appeal.submitted_at)}</span>
          </div>
        </div>
        <Button size="sm" variant="ghost" asChild className="shrink-0">
          <Link
            href={`/appeals/new?subject=${appeal.subject_id}&flag=${appeal.flag_id}`}
            className="flex items-center gap-1 text-xs"
            style={{ color: '#533afd' }}
          >
            Детали
            <ChevronRight size={12} />
          </Link>
        </Button>
      </div>

      {/* Status tracker (compact) */}
      <AppealStatusTracker currentStatus={appeal.status} />

      {/* Decision note */}
      {appeal.decision && (
        <div
          className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed"
          style={{ background: 'rgba(0,178,97,.07)', color: '#005c35', border: '1px solid rgba(0,178,97,.20)' }}
        >
          <span className="font-semibold">Решение:</span> {appeal.decision}
        </div>
      )}

      {/* Panel ref */}
      {appeal.panel_ref && (
        <p className="text-[11px] font-mono" style={{ color: '#7d8ba4' }}>
          Панель: {appeal.panel_ref}
        </p>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────
function EmptyAppeals() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16 text-center"
      style={{ border: '1.5px dashed rgba(0,55,112,.13)', background: 'rgba(248,250,253,.7)' }}
    >
      <span
        className="flex size-11 items-center justify-center rounded-full"
        style={{ background: 'rgba(83,58,253,.08)', color: '#533afd' }}
      >
        <Scale size={20} />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: '#061b31' }}>
          Апелляций ещё нет
        </p>
        <p className="text-xs" style={{ color: '#64748d' }}>
          Оспорьте активный флаг участника через арбитражную процедуру
        </p>
      </div>
      <Button asChild size="sm" style={{ background: '#533afd', color: '#fff' }}>
        <Link href="/appeals/new" className="flex items-center gap-1.5">
          <Plus size={13} />
          Подать апелляцию
        </Link>
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function AppealsPage() {
  const appeals = MOCK_APPEALS

  return (
    <>
      <title>Апелляции — PeptideTrust</title>
      <div className="flex min-h-screen flex-col" style={{ background: '#f8fafd' }}>
        <Header />

        <main className="flex-1 py-10 sm:py-14">
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">

            {/* Page header */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-xl"
                  style={{ background: '#e8e9ff', color: '#533afd' }}
                >
                  <Scale size={18} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold" style={{ color: '#061b31' }}>
                    Апелляции
                  </h1>
                  <p className="text-xs" style={{ color: '#64748d' }}>
                    {appeals.length > 0 ? `${appeals.length} апеллция` : 'Нет поданных апелляций'}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" style={{ background: '#533afd', color: '#fff' }}>
                <Link href="/appeals/new" className="flex items-center gap-1.5">
                  <Plus size={13} />
                  Подать
                </Link>
              </Button>
            </div>

            {/* Breadcrumb */}
            <nav className="mb-5 flex items-center gap-2 text-xs" style={{ color: '#64748d' }}>
              <Link href="/catalog" className="hover:underline" style={{ color: '#533afd' }}>
                Каталог
              </Link>
              <span>/</span>
              <span style={{ color: '#061b31' }}>Апелляции</span>
            </nav>

            {/* List */}
            {appeals.length === 0 ? (
              <EmptyAppeals />
            ) : (
              <div className="flex flex-col gap-4">
                {appeals.map(appeal => (
                  <AppealRow key={appeal.id} appeal={appeal} />
                ))}
              </div>
            )}

            {/* Procedure note */}
            <div
              className="mt-6 rounded-2xl border px-5 py-4"
              style={{ borderColor: '#e5edf5', background: '#fff' }}
            >
              <p className="mb-2 text-xs font-semibold" style={{ color: '#3c4f69' }}>
                Принцип неизменяемости
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#64748d' }}>
                Все апелляции и решения фиксируются ончейн и не могут быть удалены.
                Решение панели является обязательным (binding) в рамках Реестра.
                Правовой путь вне Реестра за каждой из сторон сохраняется.
              </p>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
