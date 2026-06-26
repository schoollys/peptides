import { RefreshCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBlockProps {
  title?: string
  message?: string
  requestId?: string
  onRetry?: () => void
  compact?: boolean
}

/**
 * Shared error state with optional retry and mono request_id.
 * compact=true reduces vertical padding for inline contexts (e.g. catalog).
 */
export function ErrorBlock({
  title = 'Не удалось загрузить данные',
  message = 'Произошла ошибка при получении данных. Проверьте соединение и попробуйте снова.',
  requestId,
  onRetry,
  compact = false,
}: ErrorBlockProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-border bg-white text-center ${compact ? 'px-6 py-10' : 'px-6 py-16'}`}
      style={{ boxShadow: '0 5px 14px 0 rgba(0,55,112,.06)' }}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(216,53,30,.08)' }}
      >
        <AlertTriangle size={22} style={{ color: '#d8351e' }} />
      </div>

      <h2 className="mb-1.5 text-base font-semibold" style={{ color: '#061b31' }}>
        {title}
      </h2>
      <p className="mb-5 max-w-sm text-sm" style={{ color: '#64748d' }}>
        {message}
      </p>

      {requestId && (
        <p className="mb-4 font-mono text-xs" style={{ color: '#95a4ba' }}>
          request_id:&nbsp;{requestId}
        </p>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-1.5">
          <RefreshCcw size={14} />
          Повторить
        </Button>
      )}
    </div>
  )
}
