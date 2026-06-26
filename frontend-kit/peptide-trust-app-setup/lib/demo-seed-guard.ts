/**
 * Guard that prevents demo/seed scripts from running against a production or
 * remote database. Demo data (incl. the demo@peptidetrust.eu account) must
 * never land in prod — see go-live-checklist §2.
 *
 * Bypass for staging with `ALLOW_DEMO_SEED=1`. Plain module (no `server-only`)
 * so the tsx scripts can import it.
 */

function maskUrl(url: string): string {
  return url ? url.replace(/:\/\/([^:@/]+):[^@/]+@/, '://$1:****@') : '(unset)'
}

export function assertDemoSeedAllowed(label: string): void {
  if (process.env.ALLOW_DEMO_SEED === '1') return

  const url = process.env.DATABASE_URL ?? ''
  const isProd = process.env.NODE_ENV === 'production'
  const looksRemote = Boolean(url) && !/localhost|127\.0\.0\.1|::1/.test(url)

  if (isProd || looksRemote) {
    console.error(
      `\n[${label}] Refusing to run demo seed against a production / non-local database.\n` +
        `  NODE_ENV=${process.env.NODE_ENV ?? '(unset)'}\n` +
        `  DATABASE_URL=${maskUrl(url)}\n` +
        `  If this really is a staging database, set ALLOW_DEMO_SEED=1 to override.\n`,
    )
    process.exit(1)
  }
}
