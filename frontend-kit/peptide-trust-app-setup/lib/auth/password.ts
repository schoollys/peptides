import 'server-only'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * scrypt password hashing (no external dependency).
 * Format: scrypt$<saltHex>$<keyHex>
 */
const KEYLEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEYLEN)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[1]!, 'hex')
  const expected = Buffer.from(parts[2]!, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
