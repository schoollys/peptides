import Link from 'next/link'
import { Search, Factory, FlaskConical, Users, ArrowRight, type LucideIcon } from 'lucide-react'

interface Audience {
  icon: LucideIcon
  role: string
  hook: string
  cta: string
  href: string
}

const AUDIENCES: Audience[] = [
  {
    icon: Search,
    role: 'Покупатель и исследователь',
    hook: 'Проверьте поставщика за минуту — независимая оценка вместо часов на форумах.',
    cta: 'Найти в каталоге',
    href: '/catalog',
  },
  {
    icon: Factory,
    role: 'Производитель и поставщик',
    hook: 'Превратите свою честность в преимущество — докажите качество данными, а не словами.',
    cta: 'Заявить профиль',
    href: '/claim',
  },
  {
    icon: FlaskConical,
    role: 'Лаборатория',
    hook: 'Станьте доверенным источником: ваши заключения нельзя подделать, к вам идёт поток заказов.',
    cta: 'Стать оракулом',
    href: '/claim',
  },
  {
    icon: Users,
    role: 'Организатор закупок',
    hook: 'Докажите честность закупки без эскроу — репутацией, подтверждённой данными.',
    cta: 'Подтвердить репутацию',
    href: '/claim',
  },
]

export function Audience() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-light tracking-heading text-neutral-990">
            Кому это полезно
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Один реестр закрывает разные задачи — выберите свою роль на рынке.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.role}
                href={a.href}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-brand-200 hover:shadow-stripe-md hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-medium text-neutral-990">{a.role}</h3>
                <p className="text-sm leading-relaxed text-neutral-500 flex-1">{a.hook}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  {a.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
