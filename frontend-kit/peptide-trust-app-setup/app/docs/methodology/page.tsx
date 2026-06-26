import { StubLayout, StubCard } from '@/components/layout/stub-layout'

export default function MethodologyPage() {
  const principles = [
    { label: 'Абсолютные банды 0–100', desc: 'Score не ранжируется относительно других участников — только относительно фиксированных порогов.' },
    { label: '9 факторов оценки', desc: 'QEF, PCF, SCIF, TRF, FRF, CCF, CVF, CVF_B, RF — каждый с весом по роли участника.' },
    { label: 'Верификационный множитель Vᵢ', desc: 'Снижает вес фактора при устаревших или неполных документах. Vᵢ ∈ [0,1].' },
    { label: 'Пересчёт при каждом событии', desc: 'Score обновляется при поступлении нового документа, алерта или смене статуса KYB.' },
    { label: 'BR-DAMPER буфер', desc: '30-дневный буфер защищает Score при первом флаге. Отменяется при продолжении сорсинга после алерта.' },
    { label: 'Anchor-хэш', desc: 'Каждый расчёт Score якорится хэшем состояния данных для аудита целостности.' },
  ]

  return (
    <StubLayout>
      <title>Методология — PeptideTrust</title>

      <StubCard>
        {/* Coming soon banner */}
        <div
          className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(201,162,39,.10)', border: '1px solid rgba(201,162,39,.30)', color: '#8a6800' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Полная документация методологии в подготовке
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-heading" style={{ color: '#061b31' }}>
            Методология оценки
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#64748d' }}>
            Trust Score — объективный числовой показатель от 0 до 100, вычисляемый на основе 9 независимых факторов с поправкой на верифицированность данных.
          </p>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#7d8ba4', letterSpacing: '0.05em' }}>
            Ключевые принципы
          </p>
          <ul className="flex flex-col gap-3">
            {principles.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                  style={{ background: '#e8e9ff', color: '#533afd' }}
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#061b31' }}>{p.label}</p>
                  <p className="text-sm" style={{ color: '#64748d' }}>{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <a
          href="/trust-model"
          className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
          style={{ color: '#533afd' }}
        >
          Trust-модель (обзор) →
        </a>
      </StubCard>
    </StubLayout>
  )
}
