import 'server-only'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import { hashPassword, verifyPassword } from './password'
import { initialsFrom } from './initials'
import type { SessionUser } from './types'

interface UserRow {
  id: string
  email: string
  password_hash: string
  display_name: string | null
  participant_id: string | null
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    participantId: row.participant_id,
    initials: initialsFrom(row.display_name || row.email),
  }
}

export class AuthUnavailableError extends Error {
  constructor() {
    super('Auth is not available: configure DATABASE_URL and DATA_SOURCE=db')
    this.name = 'AuthUnavailableError'
  }
}

function assertDb() {
  if (!isDatabaseEnabled()) throw new AuthUnavailableError()
}

/** Verify credentials. Returns the user on success, null on bad email/password. */
export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  assertDb()
  const sql = getSql()
  const rows = await sql<UserRow[]>`
    SELECT id, email, password_hash, display_name, participant_id
    FROM users
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `
  const row = rows[0]
  if (!row) return null
  if (!verifyPassword(password, row.password_hash)) return null
  return toSessionUser(row)
}

/** Create a new account. Returns null if the email already exists. */
export async function createUser(input: {
  email: string
  password: string
  displayName?: string | null
  participantId?: string | null
}): Promise<SessionUser | null> {
  assertDb()
  const sql = getSql()
  const existing = await sql`SELECT 1 FROM users WHERE lower(email) = lower(${input.email}) LIMIT 1`
  if (existing.length > 0) return null

  const rows = await sql<UserRow[]>`
    INSERT INTO users (email, password_hash, display_name, participant_id)
    VALUES (
      ${input.email},
      ${hashPassword(input.password)},
      ${input.displayName ?? null},
      ${input.participantId ?? null}
    )
    RETURNING id, email, password_hash, display_name, participant_id
  `
  return toSessionUser(rows[0]!)
}
