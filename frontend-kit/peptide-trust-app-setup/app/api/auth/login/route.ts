import { NextResponse } from 'next/server'
import { authenticate, AuthUnavailableError } from '@/lib/auth/users'
import { createSessionToken, sessionCookieOptions } from '@/lib/auth/session'
import { SESSION_COOKIE } from '@/lib/auth/types'
import { rateLimitAsync, clientKey } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rl = await rateLimitAsync(clientKey(request, 'login'), 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const email = (body.email ?? '').trim()
  const password = body.password ?? ''
  if (!email || !password) {
    return NextResponse.json({ error: 'Укажите email и пароль' }, { status: 400 })
  }

  try {
    const user = await authenticate(email, password)
    if (!user) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 })
    }
    const res = NextResponse.json({ user })
    res.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions)
    return res
  } catch (err) {
    if (err instanceof AuthUnavailableError) {
      return NextResponse.json({ error: 'Сервис авторизации недоступен' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
