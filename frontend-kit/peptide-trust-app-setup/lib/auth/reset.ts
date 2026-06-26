import 'server-only'
import { randomBytes, createHash } from 'node:crypto'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import { hashPassword } from './password'
import { AuthUnavailableError } from './users'

/**
 * Password reset tokens.
 *
 * The raw token is returned only to the caller of `createPasswordResetToken`
 * (to be emailed to the user). The database stores only its SHA-256 hash, so a
 * DB leak cannot be used to reset passwords. Tokens are single-use and expire.
 */

const TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes
const MIN_PASSWORD_LENGTH = 8

function assertDb() {
  if (!isDatabaseEnabled()) throw new AuthUnavailableError()
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * Issue a reset token for the account with `email`, if it exists.
 * Returns the raw token (caller delivers it via email) or null when there is no
 * such account — callers MUST respond identically either way to avoid leaking
 * which emails are registered.
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  assertDb()
  const sql = getSql()

  const rows = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE lower(email) = lower(${email}) LIMIT 1
  `
  const user = rows[0]
  if (!user) return null

  const raw = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  // Invalidate any outstanding tokens for this user, then issue a fresh one.
  await sql`
    UPDATE password_reset_tokens
       SET used_at = now()
     WHERE user_id = ${user.id} AND used_at IS NULL
  `
  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${hashToken(raw)}, ${expiresAt})
  `
  return raw
}

export type ResetOutcome = 'ok' | 'invalid' | 'weak_password'

/**
 * Consume a reset token and set a new password. The token is single-use:
 * it is marked used in the same transaction that updates the password.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
): Promise<ResetOutcome> {
  assertDb()
  if (!rawToken) return 'invalid'
  if (newPassword.length < MIN_PASSWORD_LENGTH) return 'weak_password'

  const sql = getSql()
  const tokenHash = hashToken(rawToken)

  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string; user_id: string }[]>`
      SELECT id, user_id
        FROM password_reset_tokens
       WHERE token_hash = ${tokenHash}
         AND used_at IS NULL
         AND expires_at > now()
       LIMIT 1
       FOR UPDATE
    `
    const token = rows[0]
    if (!token) return 'invalid'

    await tx`
      UPDATE users SET password_hash = ${hashPassword(newPassword)}
       WHERE id = ${token.user_id}
    `
    await tx`
      UPDATE password_reset_tokens SET used_at = now() WHERE id = ${token.id}
    `
    return 'ok'
  })
}
