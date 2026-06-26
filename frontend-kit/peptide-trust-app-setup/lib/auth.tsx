'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { SessionUser } from '@/lib/auth/types'

export type { SessionUser } from '@/lib/auth/types'

interface AuthResult {
  ok: boolean
  error?: string
}

interface SignupInput {
  email: string
  password: string
  displayName?: string
  participantId?: string
}

interface AuthState {
  user: SessionUser | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (input: SignupInput) => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoggedIn: false,
  login: async () => ({ ok: false }),
  signup: async () => ({ ok: false }),
  logout: async () => {},
})

type AuthResponse = { user?: SessionUser; error?: string }

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: AuthResponse }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data: AuthResponse = {}
  try { data = (await res.json()) as AuthResponse } catch { /* no body */ }
  return { ok: res.ok, data }
}

export function AuthProvider({
  initialUser = null,
  children,
}: {
  initialUser?: SessionUser | null
  children: ReactNode
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser)

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { ok, data } = await postJson('/api/auth/login', { email, password })
    if (ok && data?.user) {
      setUser(data.user as SessionUser)
      return { ok: true }
    }
    return { ok: false, error: data?.error ?? 'Не удалось войти' }
  }, [])

  const signup = useCallback(async (input: SignupInput): Promise<AuthResult> => {
    const { ok, data } = await postJson('/api/auth/signup', input)
    if (ok && data?.user) {
      setUser(data.user as SessionUser)
      return { ok: true }
    }
    return { ok: false, error: data?.error ?? 'Не удалось создать аккаунт' }
  }, [])

  const logout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
