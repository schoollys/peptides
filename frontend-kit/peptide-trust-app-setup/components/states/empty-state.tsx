'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type EmptyStateVariant = 'default' | 'search' | 'unclaimed' | 'error-soft'

interface EmptyStateAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'default' | 'outline' | 'ghost'
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  variant?: EmptyStateVariant
  className?: string
  compact?: boolean
}

const variantStyles: Record<EmptyStateVariant, { bg: string; iconBg: string; iconColor: string }> = {
  default:     { bg: 'bg-card',                    iconBg: 'bg-[#e8e9ff]',   iconColor: 'text-[#533afd]' },
  search:      { bg: 'bg-card',                    iconBg: 'bg-[#e5edf5]',   iconColor: 'text-[#64748d]' },
  unclaimed:   { bg: 'bg-[#f5f5ff]',              iconBg: 'bg-[#d6d9fc]',   iconColor: 'text-[#533afd]' },
  'error-soft':{ bg: 'bg-card',                    iconBg: 'bg-red-50',       iconColor: 'text-[#d8351e]' },
}

function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className,
  compact = false,
}: EmptyStateProps) {
  const styles = variantStyles[variant]

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center rounded-[16px] border border-[#e5edf5] text-center',
        styles.bg,
        'shadow-[0_5px_14px_0_rgba(0,55,112,.08),0_2px_8px_0_rgba(0,59,137,.05)]',
        compact ? 'px-6 py-10' : 'px-8 py-16',
        className,
      )}
    >
      {icon && (
        <div className={cn('mb-5 flex h-14 w-14 items-center justify-center rounded-[12px]', styles.iconBg)}>
          <span className={cn('size-7', styles.iconColor)}>{icon}</span>
        </div>
      )}

      <p className={cn('font-sans font-medium tracking-[-0.01em] text-[#061b31]', compact ? 'text-base' : 'text-lg')}>
        {title}
      </p>

      {description && (
        <p className={cn('mt-1.5 max-w-xs text-[#64748d] leading-relaxed', compact ? 'text-sm' : 'text-sm')}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            action.href ? (
              <a
                href={action.href}
                className={cn(
                  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#635bff]/50',
                  action.variant === 'outline'
                    ? 'border border-[#e5edf5] bg-white text-[#3c4f69] hover:bg-[#f8fafd]'
                    : action.variant === 'ghost'
                    ? 'text-[#533afd] hover:bg-[#e8e9ff]'
                    : 'bg-[#533afd] text-white hover:bg-[#4032c8]',
                )}
              >
                {action.label}
              </a>
            ) : (
              <Button
                variant={action.variant ?? 'default'}
                size="default"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <a
                href={secondaryAction.href}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[#64748d] transition-all hover:text-[#533afd] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#635bff]/50"
              >
                {secondaryAction.label}
              </a>
            ) : (
              <Button variant="ghost" size="default" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps, EmptyStateAction }
