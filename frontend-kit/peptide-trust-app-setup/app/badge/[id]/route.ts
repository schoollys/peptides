import { createHmac, createHash } from 'node:crypto'
import { fetchParticipant } from '@/lib/data'
import { renderBadgeSvg, type BadgeTheme, type BadgeTier } from '@/lib/badge/svg'

export const runtime = 'nodejs'

function badgeSecret(): string {
  return process.env.BADGE_SECRET || process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'
}

function svgResponse(svg: string, status = 200): Response {
  const sig = createHmac('sha256', badgeSecret()).update(svg).digest('base64')
  const etag = '"' + createHash('sha256').update(svg).digest('hex').slice(0, 32) + '"'
  return new Response(svg, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      'X-PeptideTrust-Sig': `sha256=${sig}`,
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const slug = id.replace(/\.svg$/i, '')
  const theme: BadgeTheme = new URL(request.url).searchParams.get('theme') === 'dark' ? 'dark' : 'light'

  const participant = await fetchParticipant(slug)

  if (!participant) {
    const svg = renderBadgeSvg(
      { displayName: 'Не найдено', score: null, tier: 'Watch', isProvisional: true },
      theme,
    )
    return svgResponse(svg, 404)
  }

  const svg = renderBadgeSvg(
    {
      displayName: participant.display_name,
      score: participant.score,
      tier: participant.tier as BadgeTier,
      isProvisional: participant.status === 'PROVISIONAL' || participant.score === null,
    },
    theme,
  )
  return svgResponse(svg)
}
