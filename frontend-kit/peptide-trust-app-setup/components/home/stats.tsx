import { CountUp } from '@/components/ui/count-up'
import { fetchAllParticipants } from '@/lib/data'

interface Stat {
  value: number
  suffix?: string
  label: string
}

/**
 * Registry stats computed from the live dataset (Postgres when DATA_SOURCE=db,
 * otherwise the in-memory mock). No hardcoded marketing numbers — every figure
 * reflects the actual participants currently in the registry.
 */
export async function Stats() {
  const all = await fetchAllParticipants()

  const total = all.length
  const verified = all.filter((p) => p.verified_legal).length
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0
  const incidents = all.reduce((sum, p) => sum + p.flags.length, 0)

  const scored = all.filter((p): p is typeof p & { score: number } => p.score !== null)
  const avgScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, p) => sum + p.score, 0) / scored.length)
      : 0

  const stats: Stat[] = [
    { value: total, label: 'Компаний в реестре' },
    { value: verifiedPct, suffix: '%', label: 'Верифицированных записей' },
    { value: incidents, label: 'Зафиксированных инцидентов' },
    { value: avgScore, label: 'Средний Trust Score' },
  ]

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
