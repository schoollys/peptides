'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Globe, Mail, Send, AlertTriangle, Info } from 'lucide-react'
import type { Participant } from '@/lib/participants'

interface ContactDrawerProps {
  participant: Participant
  open: boolean
  onClose: () => void
}

type Channel = 'website' | 'email' | 'telegram'

const CHANNEL_META: Record<Channel, { icon: React.FC<{ size?: number; className?: string }>; label: string; prefix: string }> = {
  website:  { icon: Globe,  label: 'Сайт',     prefix: '' },
  email:    { icon: Mail,   label: 'Email',     prefix: 'mailto:' },
  telegram: { icon: Send,   label: 'Telegram',  prefix: 'https://t.me/' },
}

export function ContactDrawer({ participant, open, onClose }: ContactDrawerProps) {
  const isWatch       = participant.tier === 'Watch' && participant.status !== 'PROVISIONAL'
  const isProvisional = participant.status === 'PROVISIONAL'
  const contacts      = participant.contacts ?? {}
  const hasContacts   = Object.values(contacts).some(Boolean)

  // Build channel rows
  const channels: { ch: Channel; value: string }[] = (
    Object.entries(contacts) as [Channel, string | undefined][]
  )
    .filter((entry): entry is [Channel, string] => !!entry[1])
    .map(([ch, value]) => ({ ch, value }))

  function buildHref(ch: Channel, value: string): string {
    if (ch === 'email')    return `mailto:${value}`
    if (ch === 'telegram') return `/out/${participant.id}?ch=telegram&dest=${encodeURIComponent(value)}`
    return `/out/${participant.id}?ch=website&dest=${encodeURIComponent(value)}`
  }

  function buildOutHref(ch: Channel, value: string): string {
    return `/out/${participant.id}?ch=${ch}&dest=${encodeURIComponent(value)}`
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        className="max-w-sm rounded-2xl p-0 overflow-hidden"
        style={{ border: '1px solid rgba(212,222,233,.8)' }}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #f0f4f8' }}>
          <DialogTitle className="text-base font-semibold" style={{ color: '#061b31' }}>
            Каналы участника
          </DialogTitle>
          <DialogDescription className="text-sm" style={{ color: '#64748d' }}>
            {participant.display_name}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
          {/* Watch warning */}
          {isWatch && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(179,38,30,.07)', border: '1px solid rgba(179,38,30,.22)' }}
              role="alert"
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#b3261e' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#7a1a14' }}>
                У участника есть подтверждённые флаги. Проявляйте осторожность при установлении контакта.
              </p>
            </div>
          )}

          {/* Provisional info */}
          {isProvisional && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(91,120,168,.08)', border: '1px solid rgba(91,120,168,.24)' }}
              role="note"
            >
              <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#5b78a8' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#3d5478' }}>
                Участник в статусе Provisional — данные накапливаются, Trust Score ещё не рассчитан.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs leading-relaxed" style={{ color: '#64748d' }}>
            Реестр предоставляет контакты как есть и{' '}
            <span className="font-medium" style={{ color: '#50617a' }}>не участвует в сделке</span>
            {' '}и не несёт ответственности за результат коммуникации.
          </p>

          {/* Channels */}
          {hasContacts ? (
            <div className="space-y-1.5 pt-1">
              {channels.map(({ ch, value }) => {
                const meta = CHANNEL_META[ch]
                const Icon = meta.icon
                const href = buildOutHref(ch, value)
                const displayValue = ch === 'telegram'
                  ? value.replace(/^@/, '')
                  : value.replace(/^https?:\/\//, '')

                return (
                  <a
                    key={ch}
                    href={href}
                    className="group flex items-center gap-3 rounded-xl border border-neutral-100/70 bg-white px-3 py-2.5 no-underline transition-colors hover:bg-neutral-25"
                    aria-label={`${meta.label}: ${displayValue}`}
                  >
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(83,58,253,.09)', color: '#533afd' }}
                    >
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium" style={{ color: '#95a4ba' }}>{meta.label}</p>
                      <p className="truncate text-sm font-medium" style={{ color: '#1a2c44' }}>
                        {displayValue}
                      </p>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12" height="12" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="flex-shrink-0 opacity-40 group-hover:opacity-70 transition-opacity"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm" style={{ color: '#95a4ba' }}>
              Контактные данные не указаны
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3"
          style={{ borderTop: '1px solid #f0f4f8', background: '#fafbfd' }}
        >
          <p className="text-[11px] text-center" style={{ color: '#95a4ba' }}>
            Переходы отслеживаются анонимно для статистики реестра
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
