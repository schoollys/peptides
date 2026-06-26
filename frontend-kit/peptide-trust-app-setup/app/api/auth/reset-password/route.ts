import { NextResponse } from 'next/server'
import { resetPasswordWithToken } from '@/lib/auth/reset'
import { AuthUnavailableError } from '@/lib/auth/users'
import { rateLimitAsync, clientKey } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/** Complete a password reset using a token from the reset email. */
export async function POST(request: Request) {
  const rl = await rateLimitAsync(clientKey(request, 'reset'), 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: { token?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const token = (body.token ?? '').trim()
  const password = body.password ?? ''
  if (!token) {
    return NextResponse.json({ error: 'Отсутствует токен сброса' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Пароль должен быть не короче 8 символов' }, { status: 400 })
  }

  try {
    const outcome = await resetPasswordWithToken(token, password)
    if (outcome === 'ok') {
      return NextResponse.json({ ok: true })
    }
    if (outcome === 'weak_password') {
      return NextResponse.json({ error: 'Пароль должен быть не короче 8 символов' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Ссылка недействительна или истекла. Запросите новую.' },
      { status: 400 },
    )
  } catch (err) {
    if (err instanceof AuthUnavailableError) {
      return NextResponse.json({ error: 'Сервис авторизации недоступен' }, { status: 503 })
    }
    console.error('[reset-password] failed:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
