'use client'

import Link from 'next/link'
import { AlertTriangle, ClipboardList, Share2, ChevronRight } from 'lucide-react'
import type { CounterpartyAlert, MyProfile } from '@/lib/dashboard-data'

interface Props {
  profile: MyProfile
  alerts: CounterpartyAlert[]
}

export function DashboardQuickCards({ profile, alerts }: Props) {
  const unread = alerts.filter(a => a.status === 'UNREAD').length
  const critical = alerts.filter(a => a.severity === 'CRITICAL').length
  const incompleteCount = profile.incomplete_fields.length

  const cards = [
    {
      icon: <AlertTriangle size={18} />,
      iconBg:
        critical > 0
          ? 'rgba(216,53,30,.10)'
          : unread > 0
          ? 'rgba(201,162,39,.10)'
          : 'rgba(83,58,253,.08)',
      iconColor:
        critical > 0
          ? '#b02010'
          : unread > 0
          ? '#8a6800'
          : '#533afd',
      label: 'Алерты контрагентов',
      value: alerts.length,
      sub:
        critical > 0
          ? `${critical} критических`
          : unread > 0
          ? `${unread} непрочитанных`
          : 'нет новых',
      subColor:
        critical > 0 ? '#b02010' : unread > 0 ? '#8a6800' : '#64748d',
      href: '#alerts',
      cta: 'Просмотреть',
    },
    {
      icon: <ClipboardList size={18} />,
      iconBg: incompleteCount > 0 ? 'rgba(201,162,39,.10)' : 'rgba(0,178,97,.08)',
      iconColor: incompleteCount > 0 ? '#8a6800' : '#007840',
      label: 'Завершить профиль',
      value: incompleteCount,
      sub: incompleteCount > 0 ? 'полей требуют заполнения' : 'профиль полный',
      subColor: incompleteCount > 0 ? '#8a6800' : '#007840',
      href: `/p/${profile.id}`,
      cta: incompleteCount > 0 ? 'Заполнить' : 'Открыть',
    },
    {
      icon: <Share2 size={18} />,
      iconBg: 'rgba(83,58,253,.08)',
      iconColor: '#533afd',
      label: 'Chain Pull: пригласить',
      value: null,
      sub: 'Поделиться ссылкой',
      subColor: '#533afd',
      href: `/p/${profile.id}/badge`,
      cta: 'Получить бейдж',
    },
  ] as const

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="group flex flex-col gap-4 rounded-2xl border border-neutral-50 bg-card p-5 shadow-stripe-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-stripe-md"
        >
          {/* Icon + value row */}
          <div className="flex items-start justify-between">
            <span
              className="flex size-9 items-center justify-center rounded-xl"
              style={{ background: card.iconBg, color: card.iconColor }}
            >
              {card.icon}
            </span>
            {card.value !== null && (
              <span className="font-sans text-3xl font-light tabular-nums leading-none tracking-tight text-neutral-990">
                {card.value}
              </span>
            )}
          </div>

          {/* Label + sub */}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-neutral-990">
              {card.label}
            </span>
            <span className="text-xs" style={{ color: card.subColor }}>
              {card.sub}
            </span>
          </div>

          {/* CTA row */}
          <div className="mt-auto flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors">
            {card.cta}
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  )
}
