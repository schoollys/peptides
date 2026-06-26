import { cn } from '@/lib/utils'
import type { Tier } from '@/lib/catalog-data'

// Tier colour config — exact brand values from globals.css
const TIER_CONFIG: Record<
  Tier,
  { bg: string; text: string; border: string; label: string }
> = {
  Platinum: {
    bg:     'rgba(140,160,184,.14)',
    text:   '#4a6580',
    border: 'rgba(140,160,184,.35)',
    label:  'Platinum',
  },
  Gold: {
    bg:     'rgba(201,162,39,.12)',
    text:   '#8a6800',
    border: 'rgba(201,162,39,.35)',
    label:  'Gold',
  },
  Silver: {
    bg:     'rgba(154,160,166,.14)',
    text:   '#505a61',
    border: 'rgba(154,160,166,.35)',
    label:  'Silver',
  },
  Bronze: {
    bg:     'rgba(176,122,69,.12)',
    text:   '#7a4c18',
    border: 'rgba(176,122,69,.32)',
    label:  'Bronze',
  },
  Watch: {
    bg:     'rgba(216,53,30,.10)',
    text:   '#b02010',
    border: 'rgba(216,53,30,.28)',
    label:  'Watch',
  },
}

interface TierPillProps {
  tier: Tier
  size?: 'sm' | 'md'
  className?: string
}

export function TierPill({ tier, size = 'md', className }: TierPillProps) {
  const cfg = TIER_CONFIG[tier]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium tabular-nums',
        size === 'sm'
          ? 'px-1.5 py-px text-[11px] leading-4'
          : 'px-2 py-0.5 text-xs leading-5',
        className
      )}
      style={{
        background:   cfg.bg,
        color:        cfg.text,
        border:       `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  )
}

export function ProvisionalPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold leading-5',
        className
      )}
      style={{
        background: 'rgba(91,120,168,.12)',
        color:      '#5b78a8',
        border:     '1px solid rgba(91,120,168,.30)',
      }}
    >
      New / Provisional
    </span>
  )
}
