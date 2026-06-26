import 'server-only'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import { ALGO_LABEL } from '@/lib/algo-versions'

export type AnchorMatch =
  | {
      kind: 'score'
      anchorHash: string
      participantSlug: string
      displayName: string
      score: number
      algoVersion: string
      computedAt: string
    }
  | {
      kind: 'coa'
      anchorHash: string
      participantSlug: string
      displayName: string
      labName: string | null
      createdAt: string
    }
  | {
      kind: 'flag'
      anchorHash: string
      participantSlug: string
      displayName: string
      flagType: string
      openedAt: string
    }

/**
 * Look up an anchor hash across the artifacts that get anchored
 * (score snapshots, COAs, penalty flags). Accepts a full hash or a
 * truncated display form like "0x3a9f...c821".
 */
export async function verifyAnchorHash(raw: string): Promise<AnchorMatch | null> {
  if (!isDatabaseEnabled()) return null
  const input = raw.trim()
  if (!input) return null

  const sql = getSql()

  // Truncated display form "0xABCD...WXYZ" → match on prefix + suffix.
  const ellipsis = input.includes('...') || input.includes('…')
  let prefix = input
  let suffix = ''
  if (ellipsis) {
    const parts = input.split(/\.{3}|…/)
    prefix = parts[0] ?? ''
    suffix = parts[1] ?? ''
  }

  const like = ellipsis ? `${prefix}%${suffix}` : input

  const scoreRows = await sql<
    {
      anchor_hash: string
      slug: string
      display_name: string
      score: string
      algo_version: number
      computed_at: Date
    }[]
  >`
    SELECT se.anchor_hash, p.slug, p.display_name, se.score,
           se.algo_version, se.computed_at
      FROM score_events se
      JOIN participants p ON p.id = se.participant_id
     WHERE se.anchor_hash IS NOT NULL
       AND ${ellipsis ? sql`se.anchor_hash LIKE ${like}` : sql`se.anchor_hash = ${input}`}
     ORDER BY se.computed_at DESC
     LIMIT 1
  `
  if (scoreRows[0]) {
    const r = scoreRows[0]
    return {
      kind: 'score',
      anchorHash: r.anchor_hash,
      participantSlug: r.slug,
      displayName: r.display_name,
      score: Number(r.score),
      algoVersion: ALGO_LABEL[r.algo_version] ?? String(r.algo_version),
      computedAt: new Date(r.computed_at).toISOString(),
    }
  }

  const coaRows = await sql<
    {
      anchor_hash: string
      slug: string
      display_name: string
      lab_name: string | null
      created_at: Date
    }[]
  >`
    SELECT c.anchor_hash, p.slug, p.display_name,
           s.accreditation AS lab_name, c.created_at
      FROM coas c
      JOIN lots l   ON l.id = c.lot_id
      JOIN participants p ON p.id = l.vendor_id
      LEFT JOIN sources s ON s.id = c.lab_id
     WHERE c.anchor_hash IS NOT NULL
       AND ${ellipsis ? sql`c.anchor_hash LIKE ${like}` : sql`c.anchor_hash = ${input}`}
     ORDER BY c.created_at DESC
     LIMIT 1
  `
  if (coaRows[0]) {
    const r = coaRows[0]
    return {
      kind: 'coa',
      anchorHash: r.anchor_hash,
      participantSlug: r.slug,
      displayName: r.display_name,
      labName: r.lab_name,
      createdAt: new Date(r.created_at).toISOString(),
    }
  }

  const flagRows = await sql<
    {
      anchor_hash: string
      slug: string
      display_name: string
      type: string
      opened_at: Date
    }[]
  >`
    SELECT pf.anchor_hash, p.slug, p.display_name, pf.type, pf.opened_at
      FROM penalty_flags pf
      JOIN participants p ON p.id = pf.participant_id
     WHERE pf.anchor_hash IS NOT NULL
       AND ${ellipsis ? sql`pf.anchor_hash LIKE ${like}` : sql`pf.anchor_hash = ${input}`}
     ORDER BY pf.opened_at DESC
     LIMIT 1
  `
  if (flagRows[0]) {
    const r = flagRows[0]
    return {
      kind: 'flag',
      anchorHash: r.anchor_hash,
      participantSlug: r.slug,
      displayName: r.display_name,
      flagType: r.type,
      openedAt: new Date(r.opened_at).toISOString(),
    }
  }

  return null
}
