import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TierPill, ProvisionalPill } from '@/components/catalog/tier-pill'
import { FACTOR_LABELS } from '@/lib/participants'
import type { Participant, Tier } from '@/lib/participants'
import { fetchAllParticipants } from '@/lib/data'

function dominantLabel(p: Participant): string {
  if (p.is_balanced) return 'Ровный профиль'
  if (p.dominant_factor) return `Сильная сторона: ${FACTOR_LABELS[p.dominant_factor]}`
  if (p.status === 'PROVISIONAL') return 'Данные собираются'
  return '—'
}

function updatedLabel(days: number): string {
  if (days === 0) return 'сегодня'
  if (days === 1) return '1 день назад'
  if (days <= 4) return `${days} дня назад`
  if (days <= 20) return `${days} дней назад`
  if (days < 30) return `${days} дней назад`
  const weeks = Math.round(days / 7)
  return `${weeks} нед. назад`
}

function scoreColor(score: number): string {
  if (score >= 78) return '#533afd'
  if (score >= 60) return '#8a6800'
  if (score >= 42) return '#505a61'
  if (score >= 20) return '#7a4c18'
  return '#b02010'
}

export async function RecentEntries() {
  const all = await fetchAllParticipants()
  // Recently updated / added participants — freshest first.
  const entries = [...all].sort((a, b) => a.updated_days_ago - b.updated_days_ago).slice(0, 7)

  return (
    <section className="border-t border-border" style={{ background: '#f8fafd' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2
              className="text-xl font-light"
              style={{ color: '#061b31', letterSpacing: '-0.01em' }}
            >
              Последние записи в реестре
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#64748d' }}>
              Недавно обновлённые и добавленные участники.
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm transition-colors duration-150 text-primary hover:text-primary/80"
          >
            Весь каталог
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-stripe-sm">
          <ul className="divide-y divide-border">
            {entries.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-secondary/60"
                >
                  {/* Name + ID + dominant factor */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#061b31' }}>
                      {p.display_name}
                    </p>
                    <p className="text-xs" style={{ color: '#95a4ba' }}>
                      <span className="font-mono tabular-nums">{p.id}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      {dominantLabel(p)}
                    </p>
                  </div>

                  {/* Score + tier + updated */}
                  <div className="flex items-center gap-3 shrink-0">
                    {p.score !== null ? (
                      <span
                        className="text-lg font-light tabular-nums"
                        style={{
                          color: scoreColor(p.score),
                          letterSpacing: '-0.01em',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {p.score.toFixed(1)}
                      </span>
                    ) : (
                      <span
                        className="text-lg font-light"
                        style={{ color: '#95a4ba', letterSpacing: '-0.01em' }}
                      >
                        —
                      </span>
                    )}

                    {p.status === 'PROVISIONAL' ? (
                      <ProvisionalPill />
                    ) : (
                      <TierPill tier={p.tier as Tier} size="sm" />
                    )}

                    <span
                      className="hidden sm:block text-xs tabular-nums"
                      style={{ color: '#95a4ba' }}
                    >
                      {updatedLabel(p.updated_days_ago)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: '#bac8da' }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 sm:hidden text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors duration-150"
          >
            Весь каталог <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
