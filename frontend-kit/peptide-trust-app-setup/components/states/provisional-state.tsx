import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type ProvisionalVariant = 'new' | 'provisional' | 'rep-note'

interface ProvisionalReason {
  label: string
  met: boolean
}

interface ProvisionalStateProps {
  displayName?: string
  variant?: ProvisionalVariant
  reasons?: ProvisionalReason[]
  /** How many tests have accumulated so far */
  testsAccumulated?: number
  /** Minimum required for full score */
  testsRequired?: number
  onSubmitData?: () => void
  onViewProfile?: () => void
  className?: string
  /** Compact: used inline in a card rather than as a full panel */
  compact?: boolean
}

const variantMeta: Record<ProvisionalVariant, { pill: string; pillText: string; heading: string }> = {
  new:         { pill: 'bg-[#e8e9ff] text-[#533afd]',    pillText: 'New',         heading: 'Профиль создан — накопление данных' },
  provisional: { pill: 'bg-[#e5edf5] text-[#50617a]',    pillText: 'Provisional', heading: 'Недостаточно данных для полного Score' },
  'rep-note':  { pill: 'bg-amber-100 text-amber-700',     pillText: 'Rep-note',    heading: 'Репутационная заметка' },
}

function ProvisionalState({
  displayName,
  variant = 'provisional',
  reasons,
  testsAccumulated = 0,
  testsRequired = 5,
  onSubmitData,
  onViewProfile,
  className,
  compact = false,
}: ProvisionalStateProps) {
  const meta = variantMeta[variant]
  const progress = Math.min(1, testsAccumulated / testsRequired)

  return (
    <div
      role="region"
      aria-label="Provisional score status"
      className={cn(
        'rounded-[16px] border border-[#e5edf5] bg-white',
        'shadow-[0_5px_14px_0_rgba(0,55,112,.08),0_2px_8px_0_rgba(0,59,137,.05)]',
        compact ? 'p-5' : 'p-7',
        className,
      )}
    >
      {/* Score placeholder + pill */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Dashed score placeholder */}
          <div className="flex h-16 w-20 items-center justify-center rounded-[10px] border-2 border-dashed border-[#d4dee9] bg-[#f8fafd]">
            <span
              className="font-mono text-3xl font-semibold tabular-nums text-[#bac8da] select-none"
              aria-label="Score недоступен"
            >
              —
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {displayName && (
              <p className="text-sm font-medium text-[#061b31] leading-none">{displayName}</p>
            )}
            <span className={cn('inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium', meta.pill)}>
              {meta.pillText}
            </span>
          </div>
        </div>

        {/* Progress ring indicator */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-[#64748d] tabular-nums">{testsAccumulated} / {testsRequired}</p>
          <p className="text-xs text-[#95a4ba]">тестов</p>
        </div>
      </div>

      {/* Heading */}
      <p className="mt-5 font-medium text-[#061b31]">{meta.heading}</p>

      {/* Explanation by variant */}
      {variant === 'new' && (
        <p className="mt-1.5 text-sm text-[#64748d] leading-relaxed">
          Полный Trust Score рассчитывается после накопления достаточного количества
          независимых тестов и завершения KYB-верификации. Профиль виден в каталоге,
          но Score не отображается.
        </p>
      )}
      {variant === 'provisional' && (
        <p className="mt-1.5 text-sm text-[#64748d] leading-relaxed">
          Накоплено <strong className="text-[#273951]">{testsAccumulated}</strong> из
          минимально необходимых <strong className="text-[#273951]">{testsRequired}</strong> независимых тестов.
          После достижения порога алгоритм автоматически вычислит Score и присвоит тир.
        </p>
      )}
      {variant === 'rep-note' && (
        <p className="mt-1.5 text-sm text-[#64748d] leading-relaxed">
          Этот участник имеет репутационную заметку в реестре. Числовой Score
          не рассчитывается до прохождения верификационной процедуры.
          Заметка видна всем пользователям каталога.
        </p>
      )}

      {/* Progress bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-[#95a4ba]">
          <span>Прогресс накопления</span>
          <span className="tabular-nums">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#e5edf5] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#533afd] transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
            role="progressbar"
            aria-valuenow={testsAccumulated}
            aria-valuemin={0}
            aria-valuemax={testsRequired}
            aria-label="Прогресс накопления тестов"
          />
        </div>
      </div>

      {/* Checklist of reasons */}
      {reasons && reasons.length > 0 && (
        <ul className="mt-5 space-y-2" aria-label="Условия для полного Score">
          {reasons.map((r) => (
            <li key={r.label} className="flex items-center gap-2.5 text-sm">
              {r.met ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f8f1]" aria-hidden="true">
                  <svg className="size-3 text-[#00b261]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e5edf5]" aria-hidden="true">
                  <svg className="size-3 text-[#95a4ba]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              )}
              <span className={r.met ? 'text-[#273951]' : 'text-[#64748d]'}>{r.label}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      {(onSubmitData || onViewProfile) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {onSubmitData && (
            <Button
              onClick={onSubmitData}
              className="focus-visible:ring-[#635bff]/50"
            >
              Подать данные
            </Button>
          )}
          {onViewProfile && (
            <Button
              variant="outline"
              onClick={onViewProfile}
              className="focus-visible:ring-[#635bff]/50"
            >
              Открыть профиль
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export { ProvisionalState }
export type { ProvisionalStateProps, ProvisionalReason }
