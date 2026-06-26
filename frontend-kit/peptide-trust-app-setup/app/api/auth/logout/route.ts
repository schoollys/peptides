import { NextResponse } from 'next/server'
import { sessionCookieOptions } from '@/lib/auth/session'
import { SESSION_COOKIE } from '@/lib/auth/types'

export const runtime = 'nodejs'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
  return res
}
