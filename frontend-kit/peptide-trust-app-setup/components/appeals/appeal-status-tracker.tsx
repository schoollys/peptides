import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import {
  APPEAL_STATUS_STEPS,
  STATUS_ORDER,
  type AppealStatus,
} from '@/lib/appeals-data'

interface AppealStatusTrackerProps {
  currentStatus: AppealStatus
}

export function AppealStatusTracker({ currentStatus }: AppealStatusTrackerProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <nav aria-label="Статус апелляции">
      <ol className="flex items-start gap-0">
        {APPEAL_STATUS_STEPS.map((step, idx) => {
          const stepIndex  = STATUS_ORDER.indexOf(step.status)
          const isCompleted = stepIndex < currentIndex
          const isActive    = step.status === currentStatus
          const isLast      = idx === APPEAL_STATUS_STEPS.length - 1

          return (
            <li key={step.status} className="flex flex-1 items-start min-w-0">
              {/* Bubble + label column */}
              <div className="flex flex-col items-center gap-2 min-w-0 flex-shrink-0">
                {/* Bubble */}
                <div
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200 shrink-0',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isActive    && [
                      'border-primary bg-primary/10 text-primary',
                      'shadow-[0_0_0_4px_oklch(47%_0.22_274_/_0.10)]',
                    ],
                    !isCompleted && !isActive && 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <span className="tabular-nums text-xs">{idx + 1}</span>
                  )}
                </div>

                {/* Labels */}
                <div className="flex flex-col items-center text-center gap-0.5 px-1">
                  <span
                    className={cn(
                      'text-xs font-semibold leading-tight whitespace-nowrap',
                      isActive    && 'text-primary',
                      isCompleted && 'text-primary/80',
                      !isCompleted && !isActive && 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground text-center hidden sm:block">
                    {step.sublabel}
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-2 mt-4 shrink">
                  <div
                    className={cn(
                      'h-px transition-colors duration-300',
                      isCompleted ? 'bg-primary' : 'bg-border',
                    )}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
