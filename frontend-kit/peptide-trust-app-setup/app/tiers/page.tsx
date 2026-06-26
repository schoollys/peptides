import { StubLayout, StubCard } from '@/components/layout/stub-layout'

const TIERS = [
  {
    name: 'Platinum',
    range: '78–100',
    bg:     'rgba(140,160,184,.14)',
    text:   '#4a6580',
    border: 'rgba(140,160,184,.35)',
    dot:    '#8ca0b8',
    desc:   'Наивысший уровень доверия: компания прошла полную проверку, данные подтверждены, нарушений нет. Подходит для критичных закупок.',
  },
  {
    name: 'Gold',
    range: '60–77',
    bg:     'rgba(201,162,39,.12)',
    text:   '#8a6800',
    border: 'rgba(201,162,39,.35)',
    dot:    '#c9a227',
    desc:   'Высокий уровень доверия: компания проверена по документам, данные в основном подтверждены. Надёжный выбор.',
  },
  {
    name: 'Silver',
    range: '42–59',
    bg:     'rgba(154,160,166,.14)',
    text:   '#505a61',
    border: 'rgba(154,160,166,.35)',
    dot:    '#9aa0a6',
    desc:   'Средний уровень доверия: часть данных ещё требует подтверждения. Можно работать с базовой осторожностью.',
  },
  {
    name: 'Bronze',
    range: '20–41',
    bg:     'rgba(176,122,69,.12)',
    text:   '#7a4c18',
    border: 'rgba(176,122,69,.32)',
    dot:    '#b07a45',
    desc:   'Базовый уровень: данные в основном со слов компании, история взаимодействий небольшая. Проверяйте детали перед сделкой.',
  },
  {
    name: 'Watch',
    range: '< 20',
    bg:     'rgba(216,53,30,.10)',
    text:   '#b02010',
    border: 'rgba(216,53,30,.28)',
    dot:    '#d8351e',
    desc:   'Низкий уровень доверия или есть зафиксированные нарушения. Будьте особенно внимательны перед закупкой.',
  },
]

export default function TiersPage() {
  return (
    <StubLayout>
      <title>Уровни доверия — PeptideTrust</title>

      <StubCard>
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-heading" style={{ color: '#061b31' }}>
            Уровни доверия: что они значат
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#64748d' }}>
            Оценка 0–100 разбита на пять уровней. Пороги фиксированы — уровень зависит только от самой компании, а не от того, как выглядят другие участники.
          </p>
        </div>

        {/* Tiers table */}
        <ul className="flex flex-col gap-3 mb-6" aria-label="Тиры доверия">
          {TIERS.map(tier => (
            <li
              key={tier.name}
              className="flex items-start gap-4 rounded-xl px-4 py-3.5"
              style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
            >
              {/* Dot + pill */}
              <div className="mt-0.5 flex shrink-0 flex-col items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: tier.dot }}
                  aria-hidden="true"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: tier.bg, color: tier.text, border: `1px solid ${tier.border}` }}
                  >
                    {tier.name}
                  </span>
                  <span
                    className="font-mono text-sm font-semibold tabular-nums"
                    style={{ color: tier.text }}
                  >
                    {tier.range}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: tier.text }}>
                  {tier.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Provisional note */}
        <div
          className="rounded-lg px-4 py-3 text-sm leading-relaxed"
          style={{ background: 'rgba(100,116,141,.08)', border: '1px solid rgba(100,116,141,.22)', color: '#3c4f69' }}
        >
          <span className="font-semibold">Новые участники.</span>{' '}
          Пока данных недостаточно (компания только добавлена или проверка отозвана), оценка не выставляется. В каталоге такие профили помечены подписью{' '}
          <span
            className="inline-flex items-center rounded-full px-1.5 py-px text-xs font-medium"
            style={{ background: 'rgba(100,116,141,.10)', color: '#4a5568', border: '1px solid rgba(100,116,141,.28)' }}
          >
            данные собираются
          </span>.
        </div>
      </StubCard>
    </StubLayout>
  )
}
