'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle2, ChevronLeft, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function FieldLabel({
  htmlFor,
  label,
  error,
}: {
  htmlFor: string
  label: string
  error?: string
}) {
  return (
    <div className="flex items-baseline justify-between">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium"
        style={{ color: '#3c4f69' }}
      >
        {label}
      </label>
      {error && (
        <span className="text-xs font-medium" style={{ color: '#d8351e' }} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErr, setFieldErr] = useState('')
  const [formErr, setFormErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function validate(): boolean {
    if (password.length < 8) {
      setFieldErr('Не короче 8 символов')
      return false
    }
    if (password !== confirm) {
      setFieldErr('Пароли не совпадают')
      return false
    }
    setFieldErr('')
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setFormErr(data.error ?? 'Не удалось сбросить пароль.')
      }
    } catch {
      setFormErr('Сетевая ошибка. Повторите попытку.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className="flex size-12 items-center justify-center rounded-full"
          style={{ background: 'rgba(0,178,97,.10)' }}
        >
          <CheckCircle2 size={22} style={{ color: '#00b261' }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#061b31', letterSpacing: '-0.01em' }}>
            Пароль обновлён
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#50617a' }}>
            Теперь вы можете войти с новым паролем.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
          style={{ color: '#533afd' }}
        >
          <ChevronLeft size={14} />
          Перейти ко входу
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className="flex size-12 items-center justify-center rounded-full"
          style={{ background: 'rgba(216,53,30,.10)' }}
        >
          <AlertCircle size={22} style={{ color: '#d8351e' }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#061b31', letterSpacing: '-0.01em' }}>
            Ссылка недействительна
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#50617a' }}>
            Токен сброса отсутствует. Запросите новую ссылку для восстановления.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
          style={{ color: '#533afd' }}
        >
          Запросить ссылку
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-1 flex size-10 items-center justify-center rounded-xl" style={{ background: 'rgba(83,58,253,.08)' }}>
        <KeyRound size={18} style={{ color: '#533afd' }} />
      </div>

      <h1 className="mt-4 mb-2 text-2xl font-semibold" style={{ color: '#061b31', letterSpacing: '-0.02em' }}>
        Новый пароль
      </h1>
      <p className="mb-6 text-sm leading-relaxed" style={{ color: '#50617a' }}>
        Придумайте новый пароль для вашего аккаунта.
      </p>

      {formErr && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
          style={{ background: 'rgba(216,53,30,.06)', color: '#b32414' }}
          role="alert"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{formErr}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="password" label="Новый пароль" error={fieldErr} />
          <Input
            id="password"
            type="password"
            placeholder="Минимум 8 символов"
            autoComplete="new-password"
            value={password}
            onChange={e => { setPassword(e.target.value); if (fieldErr) setFieldErr('') }}
            aria-invalid={!!fieldErr}
            className="h-9 text-sm"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="confirm" label="Повторите пароль" />
          <Input
            id="confirm"
            type="password"
            placeholder="Ещё раз"
            autoComplete="new-password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); if (fieldErr) setFieldErr('') }}
            aria-invalid={!!fieldErr}
            className="h-9 text-sm"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-1 w-full h-9 text-sm font-semibold"
          style={{
            background: loading ? '#7f7dfc' : '#533afd',
            color: '#ffffff',
            borderRadius: '8px',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Сохранение…
            </>
          ) : (
            'Сохранить пароль'
          )}
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <title>Новый пароль — PeptideTrust</title>

      <main
        className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
        style={{ background: '#f8fafd' }}
      >
        <div className="mb-8 select-none" aria-label="PeptideTrust">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="#533afd" />
              <path d="M8 8h5.5a4.5 4.5 0 0 1 0 9H8V8zm0 9h1.5v3H8v-3z" fill="white" fillOpacity=".9" />
              <circle cx="20" cy="18" r="2.5" fill="white" fillOpacity=".7" />
            </svg>
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: '#061b31', letterSpacing: '-0.02em' }}
            >
              PeptideTrust
            </span>
          </Link>
        </div>

        <div
          className="w-full max-w-[420px] rounded-2xl border bg-white px-8 py-9"
          style={{
            borderColor: '#e5edf5',
            boxShadow: '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)',
          }}
        >
          <Suspense fallback={<div className="h-40" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
          style={{ color: '#64748d' }}
        >
          <ChevronLeft size={14} />
          Вернуться ко входу
        </Link>
      </main>
    </>
  )
}
