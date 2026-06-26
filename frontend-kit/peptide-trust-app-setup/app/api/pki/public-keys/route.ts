import { NextResponse } from 'next/server'
import { getSql, isDatabaseEnabled } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Transparency endpoint: publishes the Ed25519 public keys of active oracle
 * (lab) sources so anyone can independently verify COA signatures. Only public
 * keys are exposed — never private material.
 */
export async function GET() {
  if (!isDatabaseEnabled()) {
    return NextResponse.json({ algorithm: 'ed25519', keys: [] })
  }

  try {
    const sql = getSql()
    const rows = await sql<{ id: string; pubkey: string | null; accreditation: string | null }[]>`
      SELECT id, pubkey, accreditation FROM sources
       WHERE type = 'lab' AND status = 'active' AND pubkey IS NOT NULL
       ORDER BY created_at ASC
    `
    const keys = rows.map((r) => ({
      id: r.id,
      accreditation: r.accreditation,
      algorithm: 'ed25519',
      publicKeyPem: r.pubkey,
    }))
    return NextResponse.json({ algorithm: 'ed25519', keys })
  } catch {
    return NextResponse.json({ algorithm: 'ed25519', keys: [] }, { status: 200 })
  }
}
