import { NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/auth/reset'
import { AuthUnavailableError } from '@/lib/auth/users'
import { rateLimitAsync, clientKey } from '@/lib/rate-limit'
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Request a password reset link. Always responds 200 with the same body
 * regardless of whether the email exists (no account enumeration).
 *
 * Delivery goes through the email adapter (lib/email.ts): Resend when
 * configured, otherwise the link is logged in non-production so the flow stays
 * testable without an email provider.
 */
export async function POST(request: Request) {
  const rl = await rateLimitAsync(clientKey(request, 'forgot'), 5, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const email = (body.email ?? '').trim()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 })
  }

  const generic = { ok: true as const }

  try {
    const token = await createPasswordResetToken(email)
    if (token) {
      const link = `${new URL(request.url).origin}/reset-password?token=${token}`
      const result = await sendPasswordResetEmail(email, link)
      if (!result.ok && !result.skipped) {
        // Provider configured but delivery failed — log for ops, still respond
        // generically so we don't leak whether the account exists.
        console.error(`[forgot-password] email delivery failed for ${email}: ${result.error}`)
      }
      // Without a provider, expose the link only outside production for testing.
      if (!isEmailConfigured() && process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ ...generic, devResetLink: link })
      }
    }
    return NextResponse.json(generic)
  } catch (err) {
    if (err instanceof AuthUnavailableError) {
      return NextResponse.json({ error: 'Сервис авторизации недоступен' }, { status: 503 })
    }
    console.error('[forgot-password] failed:', err)
    // Still respond generically to avoid leaking internal state.
    return NextResponse.json(generic)
  }
}
