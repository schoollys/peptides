'use client'

import { cn } from '@/lib/utils'
import type { ParticipantProfile } from '@/lib/profile-data'

interface TabFactorsProps {
  profile: ParticipantProfile
}

// Maps a 0–100 factor value to an indigo fill width
function valueToWidth(v: number) {
  return `${Math.min(100, Math.max(0, v))}%`
}

// Colour band for progress bar based on value
function progressColor(value: number): string {
  if (value >= 85) return '#533afd'   // brand-600 indigo
  if (value >= 65) return '#7f7dfc'   // brand-400
  if (value >= 45) return '#c9a227'   // gold-tone
  return '#d8351e'                     // error/watch
}

export function TabFactors({ profile }: TabFactorsProps) {
  const { factors, is_balanced, dominant_factor } = profile

  if (!factors || factors.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Данные по факторам отсутствуют
      </div>
    )
  }

  // Sort: dominant first, then by contribution descending
  const sorted = [...factors].sort((a, b) => {
    if (a.code === dominant_factor) return -1
    if (b.code === dominant_factor) return 1
    return b.contribution - a.contribution
  })

  const dominantLabel = dominant_factor
    ? factors.find((f) => f.code === dominant_factor)?.label ?? null
    : null

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {is_balanced ? (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            Ровный профиль — нет ярко выраженной сильной стороны
          </span>
        ) : dominantLabel ? (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            Сильная сторона: <strong>{dominantLabel}</strong>
          </span>
        ) : null}
      </div>

      {/* Factor cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((f) => {
          const isDominant = f.code === dominant_factor
          const barColor = progressColor(f.value)

          return (
            <div
              key={f.code}
              className={cn(
                'rounded-xl border bg-white p-4 shadow-stripe-xs transition-shadow hover:shadow-stripe-sm',
                isDominant && 'border-brand-200 ring-1 ring-brand-200'
              )}
              style={isDominant ? { borderColor: 'rgba(127,125,252,.35)' } : undefined}
            >
              {/* Header row */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight text-foreground">
                    {f.label}
                  </p>
                  {isDominant && (
                    <span
                      className="mt-1 inline-block rounded-md bg-accent px-1.5 py-px text-[10px] font-semibold leading-4 text-accent-foreground"
                    >
                      сильная сторона
                    </span>
                  )}
                </div>
                {/* Contribution */}
                <div className="shrink-0 text-right">
                  <span className="tabular-nums text-lg font-semibold leading-none text-foreground">
                    {f.contribution.toFixed(1)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">вклад в оценку</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#50617a' }}>Значение</span>
                  <span className="tabular-nums font-mono text-xs font-semibold text-foreground">
                    {f.value.toFixed(1)}
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(83,58,253,.10)' }}
                  role="progressbar"
                  aria-valuenow={f.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${f.label}: ${f.value.toFixed(1)} из 100`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: valueToWidth(f.value), background: barColor }}
                  />
                </div>
              </div>

              {/* Свежесть данных — по-человечески */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Данные обновлялись{' '}
                  <span className="font-medium text-foreground/70">{f.freshness_di} дн. назад</span>
                </span>
                {/* Технические детали по фактору — для тех, кому нужно */}
                <details className="group">
                  <summary className="cursor-pointer list-none text-muted-foreground/70 transition-colors hover:text-foreground/70">
                    тех. детали
                  </summary>
                  <div className="mt-1 flex flex-col gap-0.5 text-right font-mono text-[10px] text-muted-foreground/80">
                    <span>код фактора: {f.code}</span>
                    <span>множитель верификации Vᵢ: {f.v_i.toFixed(2)}</span>
                    <span>класс свежести dᵢ: {f.di_class}</span>
                  </div>
                </details>
              </div>
            </div>
          )
        })}
      </div>

      {/* Пояснение простыми словами */}
      <p className="pt-1 text-[11px] text-muted-foreground">
        Чем выше значение признака и чем независимее источник данных, тем больше его вклад
        в итоговую оценку. Свежие данные весят больше устаревших.
      </p>
    </div>
  )
}
