import { NextResponse } from 'next/server'
import { createUser, AuthUnavailableError } from '@/lib/auth/users'
import { createSessionToken, sessionCookieOptions } from '@/lib/auth/session'
import { SESSION_COOKIE } from '@/lib/auth/types'
import { rateLimitAsync, clientKey } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const rl = await rateLimitAsync(clientKey(request, 'signup'), 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: { email?: string; password?: string; displayName?: string; participantId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const email = (body.email ?? '').trim()
  const password = body.password ?? ''
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Пароль должен быть не короче 8 символов' }, { status: 400 })
  }

  try {
    const user = await createUser({
      email,
      password,
      displayName: body.displayName?.trim() || null,
      participantId: body.participantId || null,
    })
    if (!user) {
      return NextResponse.json({ error: 'Аккаунт с таким email уже существует' }, { status: 409 })
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
