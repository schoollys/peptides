import { FileCheck, Scale, ShieldAlert, BarChart3, Layers, Gift } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'

const features = [
  {
    icon: FileCheck,
    title: 'Документы, которые нельзя выдумать',
    desc: 'Сертификаты, лицензии и протоколы качества сверяются с официальными реестрами. Подделку видно сразу.',
  },
  {
    icon: Scale,
    title: 'Оценку нельзя купить',
    desc: 'Мы не берём рекламные деньги и не продаём места в рейтинге. Независимость встроена в устройство реестра.',
  },
  {
    icon: ShieldAlert,
    title: 'Открытый журнал нарушений',
    desc: 'Все нарушения публичны и с датами. Ни одна запись не удаляется без публичного объяснения.',
  },
  {
    icon: BarChart3,
    title: 'Понятная оценка 0–100',
    desc: 'Одно число показывает уровень доверия, рядом — сильная сторона компании. Без сложных формул.',
  },
  {
    icon: Layers,
    title: 'Сравнение поставщиков',
    desc: 'Сравнивайте компании по ключевым признакам надёжности — рядом, в одной таблице.',
  },
  {
    icon: Gift,
    title: 'Бесплатно для покупателей',
    desc: 'Каталог и оценки доступны бесплатно. Платить за проверку поставщика не нужно.',
  },
]

export function Features() {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-light tracking-heading text-neutral-990">
          Почему нам можно верить
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Открытые данные, проверяемые документы и публичный журнал нарушений — а не реклама.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon
          return (
            <Reveal key={f.title} delay={(i % 3) * 80} className="h-full">
              <div className="group h-full rounded-2xl bg-card p-6 border border-border flex flex-col gap-3 shadow-stripe-xs transition-all duration-200 hover:shadow-stripe-md hover:-translate-y-0.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-4 w-4 text-brand-600" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-990">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
