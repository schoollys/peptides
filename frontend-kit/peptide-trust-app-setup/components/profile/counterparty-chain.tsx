'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, EyeOff, Factory } from 'lucide-react'
import { getCounterparties, ROLE_LABELS, type CounterpartyView } from '@/lib/catalog-data'

interface CounterpartyChainProps {
  participantId: string
}

interface GroupProps {
  title: string
  hint: string
  Icon: React.ElementType
  items: CounterpartyView[]
}

function Group({ title, hint, Icon, items }: GroupProps) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} style={{ color: '#533afd' }} />
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        <span className="text-[11px] text-muted-foreground">— {hint}</span>
      </div>
      <div className="space-y-2">
        {items.map((cp) => (
          <Link
            key={`${cp.direction}-${cp.id}`}
            href={`/p/${cp.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-2.5 transition-colors hover:border-[rgba(83,58,253,.35)]"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {cp.display_name}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {ROLE_LABELS[cp.role_code]}
              </span>
            </span>
            {cp.blind_flag && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-px text-[10px] font-semibold"
                style={{ background: 'rgba(201,162,39,.14)', color: '#8a6800' }}
                title={`Источник раскрыт частично (blind-линк) · λ=${cp.lambda}`}
              >
                <EyeOff size={10} />
                blind
              </span>
            )}
            <span
              className="tabular-nums shrink-0 rounded-full px-2 py-px text-[11px] font-medium"
              style={{ background: 'rgba(83,58,253,.08)', color: '#3a28c0' }}
              title="Доля лотов по этой связи (вес Vᵢ-агрегации в V1)"
            >
              {Math.round(cp.lot_share * 100)}% лотов
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CounterpartyChain({ participantId }: CounterpartyChainProps) {
  const links = getCounterparties(participantId)
  if (links.length === 0) return null

  const upstream = links.filter((l) => l.direction === 'upstream')
  const downstream = links.filter((l) => l.direction === 'downstream')

  return (
    <div className="rounded-xl border border-border bg-white shadow-stripe-xs">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Цепочка поставок</h3>
        <p className="text-xs text-muted-foreground">
          Связанные контрагенты в реестре
        </p>
      </div>

      <div className="space-y-4 p-4">
        <Group
          title="Закупает у"
          hint="источник качества (upstream)"
          Icon={ArrowUpRight}
          items={upstream}
        />
        <Group
          title="Поставляет"
          hint="покупатели (downstream)"
          Icon={ArrowDownRight}
          items={downstream}
        />
      </div>

      <div
        className="flex items-start gap-2 border-t border-border px-4 py-2.5"
        style={{ background: 'rgba(248,250,253,.8)' }}
      >
        <Factory size={11} className="mt-0.5 shrink-0" style={{ color: '#95a4ba' }} />
        <p className="text-[11px] leading-relaxed" style={{ color: '#95a4ba' }}>
          Граф контрагентов. Наследование доверия от верифицированного источника
          (Vᵢ-пропагация) и снятие потолка тира для реселлеров включаются в V1.
        </p>
      </div>
    </div>
  )
}
