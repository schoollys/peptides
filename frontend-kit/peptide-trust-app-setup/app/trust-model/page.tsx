import { StubLayout, StubCard } from '@/components/layout/stub-layout'

export default function TrustModelPage() {
  // Что влияет на оценку — человеческим языком, без кодов
  const points = [
    {
      title: 'Что мы учитываем',
      desc: 'Качество продукции, прозрачность поставок, прослеживаемость, историю жалоб и соответствие нормам. Несколько независимых признаков, а не одно мнение.',
    },
    {
      title: 'Как мы проверяем',
      desc: 'Чем надёжнее источник, тем больше вес. Независимый тест аккредитованной лаборатории влияет на оценку сильнее, чем заявление самой компании.',
    },
    {
      title: 'Почему важна свежесть',
      desc: 'Свежие данные весят больше устаревших. Если документы и тесты давно не обновлялись, их вклад в оценку постепенно снижается.',
    },
    {
      title: 'Что снижает оценку',
      desc: 'Подтверждённые нарушения уменьшают итоговую оценку. Спорные флаги можно оспорить — до решения они не учитываются как доказанные.',
    },
  ]

  // Признаки надёжности — понятные названия (без внутренних кодов)
  const signals = [
    'Качество продукции',
    'Чистота и протоколы',
    'Стабильность поставок',
    'Прослеживаемость',
    'Риск недобросовестности',
    'История жалоб и претензий',
    'Проверка контрагентов',
    'Поведение на рынке',
    'Соответствие нормам',
  ]

  return (
    <StubLayout>
      <title>Как мы считаем оценку доверия — PeptideTrust</title>

      <StubCard>
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: '#e8e9ff' }}
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 5v5c0 4.18 3.04 8.09 7 9 3.96-.91 7-4.82 7-9V5l-7-3z" stroke="#533afd" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-heading" style={{ color: '#061b31' }}>
              Как мы считаем оценку доверия
            </h1>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: '#64748d' }}>
              Оценку мы рассчитываем по проверяемым данным, а не по отзывам или рекламе. Вот что на неё влияет.
            </p>
          </div>
        </div>

        {/* 4 человеческих пункта */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-lg px-4 py-3.5"
              style={{ background: '#f8fafd', border: '1px solid #e5edf5' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#061b31' }}>{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: '#64748d' }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Признаки надёжности — понятные названия */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#7d8ba4', letterSpacing: '0.05em' }}>
            По каким признакам мы оцениваем
          </p>
          <div className="flex flex-wrap gap-2">
            {signals.map((s) => (
              <span
                key={s}
                className="rounded-full px-3 py-1 text-sm"
                style={{ background: '#e8e9ff', color: '#3a28c0' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Технические детали — прячем под спойлер */}
        <details className="mb-6 rounded-lg" style={{ background: '#f8fafd', border: '1px solid #e5edf5' }}>
          <summary
            className="cursor-pointer list-none px-4 py-3 text-sm font-medium"
            style={{ color: '#3c4f69' }}
          >
            Для технических читателей: точная формула
          </summary>
          <div className="px-4 pb-4">
            <div
              className="mb-3 rounded-lg px-4 py-3 font-mono text-sm"
              style={{ background: '#fff', border: '1px solid #e5edf5', color: '#3c4f69' }}
              aria-label="Формула Trust Score"
            >
              TS = Σ (F<sub>i</sub> · W<sub>i</sub> · D<sub>i</sub> · V<sub>i</sub>) · (1 − P<sub>s</sub>)
            </div>
            <ul className="flex flex-col gap-1.5 text-xs leading-relaxed" style={{ color: '#64748d' }}>
              <li><strong style={{ color: '#061b31' }}>Fᵢ</strong> — значение признака [0–100].</li>
              <li><strong style={{ color: '#061b31' }}>Wᵢ</strong> — вес признака для роли участника; Σ Wᵢ = 1.</li>
              <li><strong style={{ color: '#061b31' }}>Dᵢ</strong> — коэффициент свежести [0–1]: D = 1 при dᵢ ≤ 7 дней, убывает до 0.5 при dᵢ = 90 дней.</li>
              <li><strong style={{ color: '#061b31' }}>Vᵢ</strong> — множитель верификации [0–1]: насколько данные подтверждены независимо.</li>
              <li><strong style={{ color: '#061b31' }}>Pₛ</strong> — штраф [0–1] за подтверждённые нарушения; P = 0 при их отсутствии.</li>
            </ul>
          </div>
        </details>

        {/* CTA */}
        <a
          href="/docs/methodology"
          className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
          style={{ color: '#533afd' }}
        >
          Полная методология (технический документ)
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3h6v6M11 3 3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </StubCard>
    </StubLayout>
  )
}
