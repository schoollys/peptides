import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  number: number
  label: string
  sublabel: string
}

const STEPS: Step[] = [
  { number: 1, label: 'Профиль',  sublabel: 'Найти или создать' },
  { number: 2, label: 'Проверка', sublabel: 'Подтверждение компании' },
  { number: 3, label: 'Готово',   sublabel: 'Профиль в реестре' },
]

interface ClaimStepperProps {
  currentStep: 1 | 2 | 3
}

export function ClaimStepper({ currentStep }: ClaimStepperProps) {
  return (
    <nav aria-label="Шаги верификации" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep
          const isActive    = step.number === currentStep
          const isLast      = idx === STEPS.length - 1

          return (
            <li key={step.number} className="flex flex-1 items-center min-w-0">
              {/* Step indicator + label */}
              <div className="flex flex-col items-center gap-1.5 min-w-0 flex-shrink-0">
                {/* Circle */}
                <div
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={
                    isCompleted
                      ? `Шаг ${step.number}: ${step.label} — выполнено`
                      : isActive
                      ? `Шаг ${step.number}: ${step.label} — текущий`
                      : `Шаг ${step.number}: ${step.label} — ожидание`
                  }
                  role="listitem"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200 flex-shrink-0',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isActive    && 'border-primary bg-primary/10 text-primary shadow-[0_0_0_4px_oklch(47%_0.22_274_/_0.08)]',
                    !isCompleted && !isActive && 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <>
                      <Check className="size-4" strokeWidth={2.5} aria-hidden />
                      <span className="sr-only">Выполнено</span>
                    </>
                  ) : (
                    <span className="tabular-nums" aria-hidden>{step.number}</span>
                  )}
                </div>

                {/* Labels */}
                <div className="flex flex-col items-center text-center gap-0">
                  <span
                    className={cn(
                      'text-xs font-semibold leading-tight',
                      isActive    && 'text-primary',
                      isCompleted && 'text-primary/80',
                      !isCompleted && !isActive && 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground hidden sm:block">
                    {step.sublabel}
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-3 mb-6">
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
