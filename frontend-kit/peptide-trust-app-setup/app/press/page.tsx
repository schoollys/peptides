import { StubLayout, StubCard } from '@/components/layout/stub-layout'
import { Newspaper } from 'lucide-react'

export default function PressPage() {
  const facts = [
    { label: 'Тип',       value: 'Нейтральный публичный реестр доверия' },
    { label: 'Отрасль',   value: 'Рынок пептидов (вендоры, дистрибьюторы, лаборатории, импортёры)' },
    { label: 'Методология', value: 'Trust Score 0–100, 9 факторов, верификация через Vᵢ' },
    { label: 'Бейдж',     value: 'SVG-бейдж для встройки на сайт участника' },
    { label: 'Статус',    value: 'Публичная бета' },
  ]

  return (
    <StubLayout>
      <title>Для прессы — PeptideTrust</title>

      <StubCard>
        <div className="mb-6 flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: '#e8e9ff' }}
            aria-hidden="true"
          >
            <Newspaper className="h-5 w-5" style={{ color: '#533afd' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-heading" style={{ color: '#061b31' }}>
              Для прессы
            </h1>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: '#64748d' }}>
              PeptideTrust — нейтральный публичный реестр доверия участников рынка пептидов.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div
          className="mb-6 rounded-lg px-4 py-3.5"
          style={{ background: '#f8fafd', border: '1px solid #e5edf5' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: '#3c4f69' }}>Контакт для прессы</p>
          <a
            href="mailto:press@peptidetrust.com"
            className="font-mono text-sm transition-colors hover:underline"
            style={{ color: '#533afd' }}
          >
            press@peptidetrust.com
          </a>
        </div>

        {/* Key facts */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#7d8ba4', letterSpacing: '0.05em' }}>
            О платформе
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {facts.map(f => (
              <li key={f.label} className="flex items-start gap-4 py-2.5 text-sm">
                <span className="w-28 shrink-0 font-medium" style={{ color: '#7d8ba4' }}>{f.label}</span>
                <span style={{ color: '#061b31' }}>{f.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Press kit */}
        <div
          className="flex items-start gap-3 rounded-xl border border-dashed px-4 py-4"
          style={{ borderColor: '#d4dee9' }}
        >
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(100,116,141,.10)' }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="#64748d" strokeWidth="1.3"/>
              <path d="M5 8h6M5 5.5h6M5 10.5h3.5" stroke="#64748d" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#3c4f69' }}>Пресс-кит в подготовке</p>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: '#95a4ba' }}>
              Логотипы, скриншоты и медиа-материалы будут доступны в ближайшее время.
              Для срочных запросов пишите на{' '}
              <a href="mailto:press@peptidetrust.com" className="underline" style={{ color: '#533afd' }}>
                press@peptidetrust.com
              </a>.
            </p>
          </div>
        </div>
      </StubCard>
    </StubLayout>
  )
}
