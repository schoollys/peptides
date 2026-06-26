import { StubLayout, StubCard } from '@/components/layout/stub-layout'

export default function HowItWorksPage() {
  const steps = [
    {
      n: '01',
      title: 'Найдите или заведите профиль',
      body: 'Найдите свою компанию в реестре или создайте новую карточку. Это бесплатно и занимает пару минут.',
      href: '/claim',
      cta: 'Перейти к заявке',
    },
    {
      n: '02',
      title: 'Подтвердите, что компания ваша',
      body: 'Загрузите документы компании. Проверка бывает базовой (сразу), по документам (1–3 дня) или с выездом — чем глубже проверка, тем выше доверие к вам.',
      href: '/claim/kyb',
      cta: 'Перейти к проверке',
    },
    {
      n: '03',
      title: 'Получите оценку доверия и значок для сайта',
      body: 'Мы рассчитываем оценку по нескольким признакам надёжности. Вы получаете публичную страницу профиля и значок доверия, который можно поставить на свой сайт.',
      href: '/catalog',
      cta: 'Каталог участников',
    },
  ]

  return (
    <StubLayout>
      <title>Как работает реестр — PeptideTrust</title>

      <StubCard>
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-heading" style={{ color: '#061b31' }}>
            Как работает PeptideTrust
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#64748d' }}>
            Три простых шага — от заявки до публичного профиля с оценкой доверия.
          </p>
        </div>

        {/* Visual stepper */}
        <ol className="relative flex flex-col gap-0" aria-label="Шаги онбординга">
          {steps.map((step, i) => (
            <li key={step.n} className="flex gap-5">
              {/* Spine */}
              <div className="flex flex-col items-center">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ background: '#533afd', color: '#fff' }}
                  aria-hidden="true"
                >
                  {step.n}
                </div>
                {i < steps.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: '2.5rem' }} aria-hidden="true" />
                )}
              </div>

              {/* Content */}
              <div className="pb-8 pt-1">
                <p className="text-base font-semibold" style={{ color: '#061b31' }}>{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: '#64748d' }}>{step.body}</p>
                <a
                  href={step.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                  style={{ color: '#533afd' }}
                >
                  {step.cta} →
                </a>
              </div>
            </li>
          ))}
        </ol>

        {/* Primary CTA */}
        <div className="border-t border-border pt-6">
          <a
            href="/claim"
            className="inline-flex h-9 items-center justify-center rounded px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: '#533afd' }}
          >
            Заявить профиль →
          </a>
        </div>
      </StubCard>
    </StubLayout>
  )
}
