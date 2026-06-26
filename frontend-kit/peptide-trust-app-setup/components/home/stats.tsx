import { CountUp } from '@/components/ui/count-up'

const stats = [
  { value: 1247, label: 'Компаний в реестре' },
  { value: 94, suffix: '%', label: 'Верифицированных записей' },
  { value: 312, label: 'Зафиксированных инцидентов' },
  { value: 48, suffix: 'ч', label: 'Среднее время верификации' },
]

export function Stats() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="text-3xl font-light tabular-nums tracking-heading text-primary">
                <CountUp value={s.value} suffix={s.suffix} />
              </dt>
              <dd className="mt-1 text-sm text-neutral-500">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
