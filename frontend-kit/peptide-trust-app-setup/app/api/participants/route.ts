import { NextResponse, type NextRequest } from 'next/server'
import { fetchAllParticipants } from '@/lib/data'
import { TIER_ORDER, ANCHOR_ROLE_CODES, type Tier } from '@/lib/participants'

/**
 * GET /api/participants — public segmented catalog (no auth).
 * Mirrors api/openapi.yaml #/paths/participants (filters: role, tier, factor,
 * verified_legal, q). Pagination is a no-op for the MVP dataset.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const role = sp.get('role')
  const tier = sp.get('tier')
  const factor = sp.get('factor')
  const verifiedLegal = sp.get('verified_legal')
  const q = sp.get('q')?.toLowerCase().trim()

  let data = await fetchAllParticipants()

  data = data.filter((p) => {
    if (role && p.role_code !== role) return false
    if (tier && p.tier !== tier) return false
    if (factor) {
      if (factor === 'BALANCED') {
        if (!p.is_balanced) return false
      } else if (p.dominant_factor !== factor) {
        return false
      }
    }
    if (verifiedLegal === 'true' && !p.verified_legal) return false
    if (q && !p.display_name.toLowerCase().includes(q) && !p.domain.toLowerCase().includes(q)) {
      return false
    }
    return true
  })

  data.sort((a, b) => {
    const ta = TIER_ORDER[a.tier as Tier]
    const tb = TIER_ORDER[b.tier as Tier]
    if (ta !== tb) return ta - tb
    const aa = ANCHOR_ROLE_CODES.includes(a.role_code) ? 0 : 1
    const ab = ANCHOR_ROLE_CODES.includes(b.role_code) ? 0 : 1
    if (aa !== ab) return aa - ab
    return (b.score ?? -1) - (a.score ?? -1)
  })

  return NextResponse.json({ data, next_cursor: null })
}
