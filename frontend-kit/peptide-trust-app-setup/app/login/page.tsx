'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

// ── Field label + optional error message ─────────────────────────────────────
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

// ── Divider with label ───────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: '#e5edf5' }} />
      <span className="text-xs" style={{ color: '#64748d' }}>{label}</span>
      <div className="h-px flex-1" style={{ background: '#e5edf5' }} />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPageWrapper() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [remember, setRemember]   = useState(false)
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [serverError, setServerError] = useState('')

  // Field-level errors
  const [emailErr, setEmailErr]     = useState('')
  const [passwordErr, setPasswordErr] = useState('')

  function validate(): boolean {
    let ok = true
    if (!email.trim()) {
      setEmailErr('Обязательное поле')
      ok = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr('Введите корректный email')
      ok = false
    } else {
      setEmailErr('')
    }
    if (!password) {
      setPasswordErr('Обязательное поле')
      ok = false
    } else if (password.length < 6) {
      setPasswordErr('Минимум 6 символов')
      ok = false
    } else {
      setPasswordErr('')
    }
    return ok
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)
    try {
      const result = await login(email, password)
      if (!result.ok) {
        setServerError(result.error ?? 'Неверный email или пароль')
      } else {
        router.replace(nextUrl)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <title>Вход — PeptideTrust</title>

      <main
        className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
        style={{ background: '#f8fafd' }}
      >
        {/* Wordmark */}
        <div className="mb-8 select-none" aria-label="PeptideTrust">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* Simple SVG mark */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="#533afd"/>
              <path
                d="M8 8h5.5a4.5 4.5 0 0 1 0 9H8V8zm0 9h1.5v3H8v-3z"
                fill="white"
                fillOpacity=".9"
              />
              <circle cx="20" cy="18" r="2.5" fill="white" fillOpacity=".7"/>
            </svg>
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: '#061b31', letterSpacing: '-0.02em' }}
            >
              PeptideTrust
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-[420px] rounded-2xl border bg-white px-8 py-9"
          style={{
            borderColor: '#e5edf5',
            boxShadow: '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)',
          }}
        >
          <h1
            className="mb-6 text-2xl font-semibold"
            style={{ color: '#061b31', letterSpacing: '-0.02em' }}
          >
            Вход в реестр
          </h1>

          {/* Server error */}
          {serverError && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-3"
              style={{
                background: '#fdecea',
                borderColor: 'rgba(216,53,30,.20)',
              }}
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle
                size={15}
                className="mt-px shrink-0"
                style={{ color: '#d8351e' }}
              />
              <p className="text-sm font-medium" style={{ color: '#d8351e' }}>
                {serverError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="email" label="Email" error={emailErr} />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr('') }}
                aria-invalid={!!emailErr}
                aria-describedby={emailErr ? 'email-err' : undefined}
                className="h-9 text-sm"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="password" label="Пароль" error={passwordErr} />
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (passwordErr) setPasswordErr('') }}
                  aria-invalid={!!passwordErr}
                  aria-describedby={passwordErr ? 'pw-err' : undefined}
                  className="h-9 pr-9 text-sm"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ color: '#64748d' }}
                  aria-label={showPw ? 'Скрыть пароль' : 'Показать пароль'}
                  tabIndex={0}
                >
                  {showPw
                    ? <EyeOff size={15} />
                    : <Eye size={15} />
                  }
                </button>
              </div>
            </div>

            {/* Remember me + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="size-3.5 cursor-pointer rounded border accent-primary"
                  style={{ accentColor: '#533afd' }}
                />
                <span className="text-sm" style={{ color: '#50617a' }}>Запомнить меня</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs transition-colors hover:text-primary"
                style={{ color: '#64748d' }}
              >
                Забыли пароль?
              </Link>
            </div>

            {/* Primary CTA */}
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
                  Выполняется вход…
                </>
              ) : (
                'Войти'
              )}
            </Button>

            <Divider label="или" />

            {/* PKI ghost button */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-[#f8fafd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                borderColor: '#d4dee9',
                color: '#3c4f69',
                height: '36px',
                borderRadius: '8px',
              }}
              disabled={loading}
            >
              <Lock size={13} style={{ color: '#533afd' }} />
              Войти через сертификат (PKI)
            </button>
          </form>
        </div>

        {/* Below-card link */}
        <p className="mt-6 text-sm" style={{ color: '#64748d' }}>
          Нет аккаунта?{' '}
          <Link
            href="/claim"
            className="font-medium transition-colors hover:text-primary"
            style={{ color: '#533afd' }}
          >
            Заявить профиль →
          </Link>
        </p>
      </main>
    </>
  )
}
