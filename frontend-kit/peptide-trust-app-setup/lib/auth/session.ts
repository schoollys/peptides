import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { initialsFrom } from './initials'
import { SESSION_COOKIE, type SessionUser } from './types'

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'
}

interface TokenPayload {
  sub: string
  email: string
  name: string | null
  pid: string | null
  exp: number
}

function sign(data: string): string {
  return createHmac('sha256', secret()).update(data).digest('base64url')
}

/** Create a signed, self-contained session token. */
export function createSessionToken(user: SessionUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.displayName,
    pid: user.participantId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

function verifySessionToken(token: string): SessionUser | null {
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.name ?? null,
      participantId: payload.pid ?? null,
      initials: initialsFrom(payload.name || payload.email),
    }
  } catch {
    return null
  }
}

/** Read and verify the current session from the request cookies. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_TTL_SECONDS,
}
