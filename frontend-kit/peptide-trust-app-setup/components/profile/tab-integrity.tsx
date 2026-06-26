'use client'

import { useState } from 'react'
import { ShieldCheck, Clock, Hash, Cpu, CheckCircle2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParticipantProfile } from '@/lib/profile-data'

interface CheckRowProps {
  icon: React.ElementType
  label: string
  value: string
  status: 'ok' | 'pending' | 'na'
  mono?: boolean
}

function CheckRow({ icon: Icon, label, value, status, mono }: CheckRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'rgba(83,58,253,.08)' }}
      >
        <Icon size={15} style={{ color: '#533afd' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`truncate text-sm font-medium text-foreground/90 ${mono ? 'font-mono' : ''}`}
        >
          {value}
        </p>
      </div>
      <div className="flex-shrink-0">
        {status === 'ok' && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'rgba(0,178,97,.10)', color: '#006d3d' }}
          >
            <CheckCircle2 size={10} />
            OK
          </span>
        )}
        {status === 'pending' && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'rgba(201,162,39,.12)', color: '#8a6800' }}
          >
            В ожидании
          </span>
        )}
        {status === 'na' && (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </div>
    </div>
  )
}

// Человеческие подписи уровня проверки компании (без кодов L0–L3)
const KYB_VALUE_LABELS: Record<string, string> = {
  L0: 'Не проверена',
  L1: 'Базовая проверка',
  L2: 'Проверка по документам',
  L3: 'Полная проверка',
}

interface TabIntegrityProps {
  profile: ParticipantProfile
}

export function TabIntegrity({ profile }: TabIntegrityProps) {
  const [copied, setCopied] = useState(false)
  const hasAnchor = profile.latest_anchor_hash !== '—'

  function handleCopy() {
    navigator.clipboard.writeText(profile.latest_anchor_hash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className="space-y-4">

      {/* Intro card */}
      <div
        className="rounded-xl p-4 text-sm text-muted-foreground"
        style={{ background: 'rgba(83,58,253,.05)', border: '1px solid rgba(83,58,253,.12)' }}
      >
        <p>
          Каждая оценка фиксируется так, что её нельзя изменить или переписать задним числом.
          Здесь можно убедиться, что запись подлинная.
        </p>
      </div>

      {/* Integrity checks */}
      <div className="rounded-xl border border-border bg-white shadow-stripe-xs">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Что подтверждено</h3>
        </div>
        <div className="divide-y divide-border px-4">
          <CheckRow
            icon={Hash}
            label="Код записи (защищён от подмены)"
            value={profile.latest_anchor_hash}
            status={hasAnchor ? 'ok' : 'pending'}
            mono
          />
          <CheckRow
            icon={Cpu}
            label="Версия методики расчёта"
            value={profile.algo_version}
            status="ok"
            mono
          />
          <CheckRow
            icon={Clock}
            label="Обновлено"
            value={`${profile.updated_days_ago} дней назад`}
            status={profile.updated_days_ago <= 14 ? 'ok' : 'pending'}
          />
          <CheckRow
            icon={ShieldCheck}
            label="Проверка компании"
            value={KYB_VALUE_LABELS[profile.kyb_level] ?? 'Не проверена'}
            status={profile.kyb_level === 'L0' ? 'pending' : 'ok'}
          />
        </div>
      </div>

      {/* Anchor hash deep-link */}
      {hasAnchor && (
        <div className="rounded-xl border border-border bg-white p-4 shadow-stripe-xs">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Запись, защищённая от подмены
          </p>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'rgba(83,58,253,.05)', border: '1px solid rgba(83,58,253,.12)' }}
          >
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground/80">
              {profile.latest_anchor_hash}
            </span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-primary"
              aria-label="Скопировать хеш"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://etherscan.io/search?q=${profile.latest_anchor_hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Посмотреть в блокчейне ↗
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Score events count */}
      <p className="text-right text-xs text-muted-foreground">
        Всего записей оценки: {profile.score_events.length}
      </p>
    </div>
  )
}
