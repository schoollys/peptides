import { ImageResponse } from 'next/og'
import { getMockProfile } from '@/lib/profile-data'

export const alt = 'PeptideTrust — профиль участника'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const TIER_COLORS: Record<string, string> = {
  Platinum: '#5b9bd5',
  Gold: '#c9a227',
  Silver: '#9aa0a6',
  Bronze: '#b07a45',
  Watch: '#b3261e',
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = getMockProfile(id)

  const name = p?.display_name ?? 'PeptideTrust'
  const domain = p?.domain ?? 'peptidetrust.app'
  const hasScore = p != null && p.score != null
  const scoreText = hasScore ? p!.score!.toFixed(1) : '—'
  const tier = p?.tier ?? 'New'
  const tierColor = TIER_COLORS[tier] ?? '#533afd'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0b1f38 0%, #122a4a 55%, #1c1746 100%)',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#533afd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              color: '#fff',
            }}
          >
            ◆
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            PeptideTrust
          </div>
        </div>

        {/* Participant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#fff', lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 28, color: '#9fb3cc' }}>{domain}</div>
        </div>

        {/* Score block */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, color: '#7d8ba4', letterSpacing: '0.18em' }}>TRUST SCORE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontSize: 110, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{scoreText}</div>
              <div style={{ fontSize: 34, color: '#7d8ba4' }}>/ 100</div>
            </div>
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: '#fff',
              background: tierColor,
              borderRadius: 999,
              padding: '8px 28px',
              marginBottom: 14,
            }}
          >
            {hasScore ? tier : 'New / Provisional'}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
