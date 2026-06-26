'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, LogIn } from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface RequireAuthProps {
  children: React.ReactNode
}

/**
 * Renders children when the user is logged in.
 * Otherwise shows an inline "please sign in" screen.
 * Does NOT hard-redirect — uses a soft gate so the page shell
 * (Header/Footer) stays visible.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isLoggedIn } = useAuth()
  const pathname = usePathname()
  // Avoid SSR flash: wait one tick for localStorage to hydrate
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) return null

  if (!isLoggedIn) {
    const loginHref = `/login?next=${encodeURIComponent(pathname)}`
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16"
        style={{ background: '#f8fafd' }}
      >
        <div
          className="w-full max-w-[380px] rounded-2xl border bg-white px-8 py-9 text-center"
          style={{
            borderColor: '#e5edf5',
            boxShadow: '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)',
          }}
        >
          {/* Icon */}
          <span
            className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(83,58,253,.08)' }}
          >
            <ShieldCheck size={22} style={{ color: '#533afd' }} />
          </span>

          <h2
            className="mb-2 text-lg font-semibold"
            style={{ color: '#061b31', letterSpacing: '-0.02em' }}
          >
            Войдите, чтобы продолжить
          </h2>
          <p className="mb-7 text-sm leading-relaxed" style={{ color: '#64748d' }}>
            Этот раздел доступен только авторизованным участникам реестра.
          </p>

          <Link
            href={loginHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: '#533afd', borderRadius: '8px' }}
          >
            <LogIn size={15} />
            Войти в реестр
          </Link>

          <p className="mt-5 text-sm" style={{ color: '#95a4ba' }}>
            Нет аккаунта?{' '}
            <Link href="/claim" className="font-medium hover:underline" style={{ color: '#533afd' }}>
              Заявить профиль
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
