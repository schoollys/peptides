'use client'

import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProfileErrorProps {
  requestId?: string
  onRetry?: () => void
  notFound?: boolean
}

export function ProfileError({ requestId, onRetry, notFound }: ProfileErrorProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border bg-white px-6 py-16 text-center shadow-stripe-sm">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(216,53,30,.08)' }}
      >
        <AlertTriangle size={24} style={{ color: '#d8351e' }} />
      </div>

      <h2 className="mb-1.5 text-lg font-semibold text-foreground">
        {notFound ? 'Участник не найден' : 'Не удалось загрузить профиль'}
      </h2>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {notFound
          ? 'Участник с таким идентификатором не существует или был удалён из реестра.'
          : 'Произошла ошибка при загрузке данных. Проверьте соединение и попробуйте снова.'}
      </p>

      {requestId && (
        <p className="mb-5 font-mono text-xs text-muted-foreground">
          request_id: {requestId}
        </p>
      )}

      {!notFound && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-1.5">
          <RefreshCcw size={14} />
          Повторить
        </Button>
      )}
    </div>
  )
}
