import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

const footerLinks: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Платформа',
    links: [
      { label: 'Trust-модель', href: '/trust-model' },
      { label: 'Как работает реестр', href: '/how-it-works' },
      { label: 'Тиры доверия', href: '/tiers' },
    ],
  },
  {
    heading: 'Документы',
    links: [
      { label: 'Методология', href: '/docs/methodology' },
      { label: 'Лог инцидентов', href: '/incidents' },
      { label: 'API Reference', href: '/docs/api' },
    ],
  },
  {
    heading: 'Правовое',
    links: [
      { label: 'Условия использования', href: '/legal/terms' },
      { label: 'Политика конфиденциальности', href: '/legal/privacy' },
      { label: 'Отказ от ответственности', href: '/legal/disclaimer' },
      { label: 'Оператор и юрисдикция', href: '/legal/jurisdiction' },
    ],
  },
  {
    heading: 'Контакты',
    links: [
      { label: 'Сообщить о нарушении', href: '/report' },
      { label: 'Пресса', href: '/press' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Top grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded"
                style={{ background: '#533afd' }}
              >
                <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: '#061b31', letterSpacing: '-0.01em' }}
              >
                PeptideTrust
              </span>
            </Link>
            <p className="text-xs leading-relaxed" style={{ color: '#64748d' }}>
              Нейтральный публичный реестр доверия для участников рынка пептидов.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#7d8ba4', letterSpacing: '0.05em' }}
              >
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-150 hover:text-primary"
                      style={{ color: '#50617a' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Global legal disclaimer — required on all pages */}
        {/* TODO: на ревью юриста */}
        <div
          className="mt-10 rounded-xl px-4 py-3 text-xs leading-relaxed"
          style={{
            background: 'rgba(100,116,141,.06)',
            border:     '1px solid rgba(212,222,233,.7)',
            color:      '#64748d',
          }}
        >
          PeptideTrust — нейтральный информационный реестр (research-use-only). Не маркетплейс,
          не участвует в сделках, не даёт медицинских или юридических рекомендаций.
          Оценки носят информационный характер и не являются обвинением, аудиторским заключением
          или рекомендацией к совершению сделок.{' '}
          <a href="/legal/disclaimer" className="underline hover:no-underline" style={{ color: '#533afd' }}>
            Подробнее
          </a>
          {' · '}
          <a href="/legal/terms" className="underline hover:no-underline" style={{ color: '#533afd' }}>
            Условия
          </a>
          {' · '}
          <a href="/legal/privacy" className="underline hover:no-underline" style={{ color: '#533afd' }}>
            Конфиденциальность
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-4 flex flex-col items-start gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs" style={{ color: '#7d8ba4' }}>
            &copy; {new Date().getFullYear()} PeptideTrust. Все права защищены.
          </p>
          <p className="text-xs" style={{ color: '#95a4ba' }}>
            EU/CH · MVP-скоуп
          </p>
        </div>
      </div>
    </footer>
  )
}
