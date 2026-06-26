'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2, ChevronLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Field label ──────────────────────────────────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  function validate(): boolean {
    if (!email.trim()) {
      setEmailErr('Обязательное поле')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr('Введите корректный email')
      return false
    }
    setEmailErr('')
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show the same confirmation regardless of the response, so the UI
      // never reveals whether the email is registered.
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <title>Восстановление доступа — PeptideTrust</title>

      <main
        className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
        style={{ background: '#f8fafd' }}
      >
        {/* Wordmark */}
        <div className="mb-8 select-none" aria-label="PeptideTrust">
          <Link href="/" className="inline-flex items-center gap-2">
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
          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div
                className="flex size-12 items-center justify-center rounded-full"
                style={{ background: 'rgba(0,178,97,.10)' }}
              >
                <CheckCircle2 size={22} style={{ color: '#00b261' }} />
              </div>
              <div>
                <h1
                  className="text-xl font-semibold"
                  style={{ color: '#061b31', letterSpacing: '-0.01em' }}
                >
                  Письмо отправлено
                </h1>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: '#50617a' }}>
                  Если аккаунт существует, мы отправили ссылку на{' '}
                  <span className="font-medium" style={{ color: '#3c4f69' }}>
                    {email}
                  </span>
                  . Проверьте папку «Спам», если письмо не пришло в течение нескольких минут.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
                style={{ color: '#533afd' }}
              >
                <ChevronLeft size={14} />
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-1 flex size-10 items-center justify-center rounded-xl" style={{ background: 'rgba(83,58,253,.08)' }}>
                <Mail size={18} style={{ color: '#533afd' }} />
              </div>

              <h1
                className="mt-4 mb-2 text-2xl font-semibold"
                style={{ color: '#061b31', letterSpacing: '-0.02em' }}
              >
                Восстановление доступа
              </h1>
              <p className="mb-6 text-sm leading-relaxed" style={{ color: '#50617a' }}>
                Введите email вашего аккаунта — мы пришлём ссылку для сброса пароля.
              </p>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
                    className="h-9 text-sm"
                    disabled={loading}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
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
                      Отправка…
                    </>
                  ) : (
                    'Отправить ссылку'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Back link (shown only in form state so it doesn't duplicate the success link) */}
        {!sent && (
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
            style={{ color: '#64748d' }}
          >
            <ChevronLeft size={14} />
            Вернуться ко входу
          </Link>
        )}
      </main>
    </>
  )
}
