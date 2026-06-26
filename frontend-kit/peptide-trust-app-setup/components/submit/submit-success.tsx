'use client'

import { CheckCircle2, Clock, Hash, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { SubmissionResponse } from '@/lib/submit-data'

interface SubmitSuccessProps {
  response: SubmissionResponse
  onReset:  () => void
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: 'short',
  }).format(new Date(iso))
}

export function SubmitSuccess({ response, onReset }: SubmitSuccessProps) {
  return (
    <div className="space-y-6">
      {/* Primary success banner */}
      <div
        className="flex items-start gap-3.5 rounded-2xl border px-5 py-4"
        style={{ borderColor: '#00b26133', backgroundColor: '#00b2610d' }}
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: '#00b261' }} />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold" style={{ color: '#00b261' }}>
            Принято · 202 Accepted
          </p>
          <p className="text-sm text-[#3c4f69] leading-relaxed">
            Данные поставлены в очередь. Пересчёт Trust Score выполняется асинхронно
            — обычно занимает 2–5 минут.
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetaCell
          icon={<Hash className="size-3.5" />}
          label="submission_id"
          value={response.submission_id}
          mono
        />
        <MetaCell
          icon={<Clock className="size-3.5" />}
          label="В очереди с"
          value={fmt(response.queued_at)}
        />
        <MetaCell
          icon={<Clock className="size-3.5" />}
          label="Ожидаемый пересчёт"
          value={fmt(response.estimated_recalc)}
        />
        <MetaCell
          icon={<Hash className="size-3.5" />}
          label="request_id"
          value={response.request_id}
          mono
        />
      </div>

      {/* Status pipeline */}
      <div
        className="rounded-2xl border border-border bg-neutral-50/60 px-5 py-4"
        style={{ backgroundColor: '#f8fafd' }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Статус обработки
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusStep label="submission queued" active />
          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
          <StatusStep label="pending_verification" />
          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
          <StatusStep label="score recalculation" />
          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
          <StatusStep label="published" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button
          size="default"
          className="flex-1 h-9 font-semibold"
          onClick={onReset}
        >
          Подать ещё одну запись
        </Button>
        <Button
          variant="outline"
          size="default"
          className="flex-1 h-9"
          asChild
        >
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>

      {/* Support hint */}
      <p className="text-center text-xs text-muted-foreground">
        Проблемы с обработкой? Укажите{' '}
        <code className="rounded bg-secondary px-1 py-px font-mono text-[11px]">
          {response.request_id}
        </code>{' '}
        при обращении в поддержку.
      </p>
    </div>
  )
}

function MetaCell({
  icon, label, value, mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 shadow-stripe-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p
        className={[
          'text-sm font-medium text-[#1a2c44] break-all',
          mono ? 'font-mono text-xs' : '',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function StatusStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={
        active
          ? { backgroundColor: '#e8e9ff', color: '#533afd' }
          : { backgroundColor: '#e5edf5', color: '#64748d' }
      }
    >
      {label}
    </span>
  )
}
