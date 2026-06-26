/* -----------------------------------------------------------------------
   Single source of truth for the Trust Badge SVG.

   Used by both the server endpoint (app/badge/[id]/route.ts) and the client
   preview (components/badge/badge-preview.tsx), so what a third party embeds
   is byte-identical to what the dashboard shows.
   ----------------------------------------------------------------------- */

export type BadgeTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Watch'
export type BadgeTheme = 'light' | 'dark'

export interface BadgeData {
  displayName: string
  score: number | null
  tier: BadgeTier
  isProvisional: boolean
}

const TIER_COLORS: Record<BadgeTier, { bg: string; text: string; dot: string }> = {
  Platinum: { bg: '#dce6f0', text: '#2e4a62', dot: '#8ca0b8' },
  Gold: { bg: '#faf0cc', text: '#7a5800', dot: '#c9a227' },
  Silver: { bg: '#e8eaeb', text: '#3d474e', dot: '#9aa0a6' },
  Bronze: { bg: '#f5e8da', text: '#6b3d10', dot: '#b07a45' },
  Watch: { bg: '#fce8e5', text: '#8b1a0e', dot: '#d8351e' },
}

const TIER_COLORS_DARK: Record<BadgeTier, { bg: string; text: string; dot: string }> = {
  Platinum: { bg: '#1c2e3d', text: '#a8c4d8', dot: '#8ca0b8' },
  Gold: { bg: '#2e2200', text: '#f5c842', dot: '#c9a227' },
  Silver: { bg: '#1f2428', text: '#b0b8bf', dot: '#9aa0a6' },
  Bronze: { bg: '#2a1a08', text: '#d4a06a', dot: '#b07a45' },
  Watch: { bg: '#2e0a06', text: '#f07060', dot: '#d8351e' },
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderBadgeSvg(data: BadgeData, theme: BadgeTheme = 'light'): string {
  const palette = theme === 'dark' ? TIER_COLORS_DARK : TIER_COLORS
  const tierCfg = palette[data.tier]
  const isProvis = data.isProvisional || data.score === null

  const W = 260
  const H = 72
  const RADIUS = 10
  const PAD_X = 14
  const PAD_Y = 12

  const bg = theme === 'dark' ? '#0f1923' : '#ffffff'
  const border = theme === 'dark' ? '#1e2f40' : '#e5edf5'
  const textMain = theme === 'dark' ? '#e8f0f8' : '#061b31'
  const textSub = theme === 'dark' ? '#6a8aaa' : '#64748d'
  const brandFg = theme === 'dark' ? '#a09dff' : '#533afd'

  const scoreStr = isProvis ? '—' : (data.score?.toFixed(1) ?? '—')
  const tierLabel = data.tier
  const name =
    data.displayName.length > 22 ? data.displayName.slice(0, 22) + '…' : data.displayName
  const font = "'Inter', -apple-system, sans-serif"

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(`Trust badge: ${data.displayName}, Score ${scoreStr}, Tier ${tierLabel}`)}">
  <defs><clipPath id="clip-badge"><rect width="${W}" height="${H}" rx="${RADIUS}"/></clipPath></defs>
  <rect width="${W}" height="${H}" rx="${RADIUS}" fill="${bg}"/>
  <rect width="${W}" height="${H}" rx="${RADIUS}" fill="none" stroke="${border}" stroke-width="1"/>
  <rect x="0" y="0" width="4" height="${H}" rx="${RADIUS}" clip-path="url(#clip-badge)" fill="${tierCfg.dot}"/>
  <text x="${PAD_X + 14}" y="${PAD_Y + 22}" font-family="${font}" font-weight="700" font-size="26" fill="${textMain}" letter-spacing="-0.5" font-variant-numeric="tabular-nums" text-anchor="middle">${escapeXml(scoreStr)}</text>
  <text x="${PAD_X + 14}" y="${PAD_Y + 34}" font-family="${font}" font-weight="400" font-size="8.5" fill="${textSub}" text-anchor="middle" letter-spacing="0.3">TRUST SCORE</text>
  <line x1="52" y1="14" x2="52" y2="${H - 14}" stroke="${border}" stroke-width="1"/>
  <text x="62" y="${PAD_Y + 10}" font-family="${font}" font-weight="600" font-size="11.5" fill="${textMain}" letter-spacing="-0.1">${escapeXml(name)}</text>
  <rect x="62" y="${PAD_Y + 16}" width="62" height="16" rx="8" fill="${tierCfg.bg}" stroke="${tierCfg.dot}" stroke-width="0.75" stroke-opacity="0.6"/>
  <circle cx="75" cy="${PAD_Y + 24}" r="3.5" fill="${tierCfg.dot}"/>
  <text x="82" y="${PAD_Y + 27.5}" font-family="${font}" font-weight="500" font-size="9.5" fill="${tierCfg.text}">${escapeXml(tierLabel)}</text>
  <text x="62" y="${H - PAD_Y + 2}" font-family="${font}" font-weight="500" font-size="9" fill="${brandFg}" letter-spacing="-0.1">PeptideTrust ✓</text>
</svg>`
}
