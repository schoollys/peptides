import 'server-only'
import postgres from 'postgres'

/**
 * Lazy Postgres client (porsager/postgres).
 *
 * The connection is created only on first use, so importing this module (or the
 * repository) never throws when DATABASE_URL is absent — e.g. during the Vercel
 * build, where the app falls back to the in-memory mock (see lib/data.ts).
 * Reused across dev hot-reloads via globalThis to avoid connection storms.
 */

type Sql = ReturnType<typeof postgres>

declare global {
  var __ptSql: Sql | undefined
}

let cached: Sql | undefined

function intEnv(name: string, fallback: number): number {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function getSql(): Sql {
  if (cached) return cached
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  cached =
    globalThis.__ptSql ??
    postgres(connectionString, {
      // Pool sizing/timeouts are env-tunable for prod load. Keep `max` modest on
      // serverless (many instances × pool) to avoid exhausting Postgres.
      max: intEnv('DB_POOL_MAX', 5),
      idle_timeout: intEnv('DB_IDLE_TIMEOUT', 20),
      connect_timeout: intEnv('DB_CONNECT_TIMEOUT', 10),
      transform: { undefined: null },
    })
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__ptSql = cached
  }
  return cached
}

/** True when the app is configured to read from the database. */
export function isDatabaseEnabled(): boolean {
  return process.env.DATA_SOURCE === 'db' && Boolean(process.env.DATABASE_URL)
}
