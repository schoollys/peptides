'use client'

import type { ParticipantProfile } from '@/lib/profile-data'
import { renderBadgeSvg, type BadgeTier } from '@/lib/badge/svg'

interface BadgePreviewProps {
  profile: ParticipantProfile
  theme: 'light' | 'dark'
}

// ── Inline SVG badge — renders the exact markup the /badge/[id].svg endpoint
//    serves (single source of truth in lib/badge/svg.ts). ──────────────────
export function BadgeSvg({ profile, theme }: BadgePreviewProps) {
  const svg = renderBadgeSvg(
    {
      displayName: profile.display_name,
      score: profile.score,
      tier: profile.tier as BadgeTier,
      isProvisional: profile.status === 'PROVISIONAL' || profile.score === null,
    },
    theme,
  )
  return <span aria-hidden={false} dangerouslySetInnerHTML={{ __html: svg }} />
}

// ── Theme segmented control + preview wrapper ────────────────────────────────
interface BadgePreviewCardProps {
  profile: ParticipantProfile
  theme: 'light' | 'dark'
  onThemeChange: (t: 'light' | 'dark') => void
}

export function BadgePreviewCard({ profile, theme, onThemeChange }: BadgePreviewCardProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Segmented control — Stripe style, h-8, indigo active */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#64748d]">Тема</span>
        <div
          className="flex h-8 rounded-lg p-[3px] gap-[2px]"
          role="group"
          aria-label="Выбор темы превью"
          style={{ background: '#f0f2f7', border: '1px solid #e5edf5' }}
        >
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onThemeChange(t)}
              aria-pressed={theme === t}
              className="h-full px-3 text-xs font-medium rounded-md transition-all"
              style={{
                background: theme === t ? '#533afd' : 'transparent',
                color:      theme === t ? '#ffffff' : '#64748d',
                boxShadow:  theme === t ? '0 1px 4px rgba(83,58,253,.25)' : 'none',
              }}
            >
              {t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>

      {/* Badge preview */}
      <div
        className="flex items-center justify-center rounded-[12px] p-8 transition-colors"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, #0d1520 0%, #0f1923 100%)'
            : 'linear-gradient(135deg, #f8fafd 0%, #eff4f9 100%)',
          border: `1px solid ${theme === 'dark' ? '#1e2f40' : '#e5edf5'}`,
          minHeight: 140,
        }}
      >
        <BadgeSvg profile={profile} theme={theme} />
      </div>

      {/* Size annotation */}
      <p className="text-[11px] text-[#9aa0a6] text-center">
        260 × 72 px · SVG · серверная подпись включена
      </p>
    </div>
  )
}
