'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type ErrorSeverity = 'default' | 'critical' | 'degraded'

interface ErrorStateProps {
  title?: string
  description?: string
  requestId?: string
  severity?: ErrorSeverity
  onRetry?: () => void
  /** If true: shows note that public read still works (external service degradation) */
  isDegradation?: boolean
  className?: string
  compact?: boolean
}

const severityConfig: Record<ErrorSeverity, { border: string; iconBg: string; iconColor: string; badge: string; badgeText: string }> = {
  default: {
    border:    'border-[#e5edf5]',
    iconBg:    'bg-red-50',
    iconColor: 'text-[#d8351e]',
    badge:     'bg-red-50 text-[#d8351e]',
    badgeText: '422',
  },
  critical: {
    border:    'border-[#d8351e]/30',
    iconBg:    'bg-[#d8351e]/10',
    iconColor: 'text-[#d8351e]',
    badge:     'bg-[#d8351e] text-white',
    badgeText: '500',
  },
  degraded: {
    border:    'border-amber-200',
    iconBg:    'bg-amber-50',
    iconColor: 'text-amber-600',
    badge:     'bg-amber-100 text-amber-700',
    badgeText: '503',
  },
}

function ErrorState({
  title = 'Не удалось загрузить данные',
  description,
  requestId,
  severity = 'default',
  onRetry,
  isDegradation = false,
  className,
  compact = false,
}: ErrorStateProps) {
  const [copied, setCopied] = useState(false)
  const cfg = severityConfig[severity]

  function copyRequestId() {
    if (!requestId) return
    navigator.clipboard.writeText(requestId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'rounded-[16px] border bg-white',
        cfg.border,
        'shadow-[0_5px_14px_0_rgba(0,55,112,.08),0_2px_8px_0_rgba(0,59,137,.05)]',
        compact ? 'p-5' : 'p-7',
        className,
      )}
    >
      {/* Top row: icon + title + retry */}
      <div className="flex items-start gap-4">
        <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]', cfg.iconBg)}>
          <svg className={cn('size-5', cfg.iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-[#061b31]">{title}</p>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-semibold tabular-nums', cfg.badge)}>
              {cfg.badgeText}
            </span>
          </div>

          {description && (
            <p className="mt-1 text-sm text-[#64748d] leading-relaxed">{description}</p>
          )}

          {/* request_id */}
          {requestId && (
            <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[#e5edf5] bg-[#f8fafd] px-3 py-2">
              <span className="text-xs text-[#64748d]">request_id</span>
              <code className="flex-1 truncate font-mono text-xs text-[#273951]">{requestId}</code>
              <button
                onClick={copyRequestId}
                className="ml-1 shrink-0 rounded px-1.5 py-0.5 text-xs text-[#533afd] transition-colors hover:bg-[#e8e9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]/50"
                aria-label="Скопировать request_id"
              >
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
          )}

          {/* Degradation note */}
          {isDegradation && (
            <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2.5">
              <svg className="mt-0.5 size-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">
                Деградация внешнего сервиса не влияет на публичный read-доступ. Score-бейдж и профиль
                отдаются из подписанного кэша без задержки.
              </p>
            </div>
          )}
        </div>

        {/* Retry button */}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0 focus-visible:ring-[#635bff]/50"
          >
            Повторить
          </Button>
        )}
      </div>
    </div>
  )
}

export { ErrorState }
export type { ErrorStateProps }
