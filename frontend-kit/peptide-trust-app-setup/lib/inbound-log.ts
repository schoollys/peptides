/**
 * lib/inbound-log.ts
 *
 * Reads the mock outbound-click log from localStorage (key: pt_outbound_log)
 * written by /out/[id]. For the dashboard "Поток обращений" card.
 *
 * If the log has fewer than 2 events for the current participant,
 * seeds 14–30 plausible events spread over the last 30 days.
 *
 * Privacy: exposes only aggregates — counts, channels, dates.
 * No personal data, no content, no destination URLs.
 */

const STORAGE_KEY = 'pt_outbound_log'
const CHANNELS = ['website', 'email', 'telegram'] as const
export type Channel = (typeof CHANNELS)[number]

export interface OutboundEntry {
  id:            string
  participantId: string
  channel:       Channel
  dest:          string   // stored but never surfaced to the UI
  ts:            string
}

export interface InboundStats {
  count7d:   number
  count30d:  number
  delta7d:   number   // vs prior 7d window
  delta30d:  number   // vs prior 30d window
  /** daily bucket counts for the last 30 days, index 0 = oldest */
  daily30d:  number[]
  channels:  Record<Channel, number>
  seeded:    boolean
}

// ─── Seed helper ──────────────────────────────────────────────────────────────

function seedEvents(participantId: string): OutboundEntry[] {
  const count  = 14 + Math.floor(Math.random() * 17)   // 14–30
  const now    = Date.now()
  const ms30d  = 30 * 24 * 60 * 60 * 1000
  const chWeights: Channel[] = [
    'website', 'website', 'website',   // ~50%
    'email',   'email',               // ~33%
    'telegram',                        // ~17%
  ]

  return Array.from({ length: count }, (_, i) => {
    const msAgo = Math.random() * ms30d
    const ch    = chWeights[Math.floor(Math.random() * chWeights.length)]
    return {
      id:            `seed_${i}_${Math.random().toString(36).slice(2, 7)}`,
      participantId,
      channel:       ch,
      dest:          '',   // blank — not surfaced
      ts:            new Date(now - msAgo).toISOString(),
    }
  }).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
}

// ─── Main read fn (client-side only) ─────────────────────────────────────────

export function readInboundStats(participantId: string): InboundStats {
  if (typeof window === 'undefined') return emptyStats()

  let entries: OutboundEntry[] = []
  try {
    entries = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { /* ignore */ }

  // Filter to this participant
  let mine = entries.filter(e => e.participantId === participantId)

  // Seed if sparse
  let seeded = false
  if (mine.length < 2) {
    const seeds = seedEvents(participantId)
    // Merge seeds into the global log (without duplication)
    const merged = [
      ...entries.filter(e => e.participantId !== participantId),
      ...seeds,
    ].slice(0, 500)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch { /* ignore */ }
    mine   = seeds
    seeded = true
  }

  const now   = Date.now()
  const d7    = 7  * 24 * 60 * 60 * 1000
  const d30   = 30 * 24 * 60 * 60 * 1000

  const inWindow = (ts: string, ms: number) =>
    now - new Date(ts).getTime() <= ms

  const count7d  = mine.filter(e => inWindow(e.ts, d7)).length
  const count30d = mine.filter(e => inWindow(e.ts, d30)).length

  // Delta: compare count7d vs the prior 7-day window
  const prior7start = d7 * 2
  const prior7d = mine.filter(e => {
    const age = now - new Date(e.ts).getTime()
    return age > d7 && age <= prior7start
  }).length
  const delta7d = count7d - prior7d

  // Delta 30d vs prior 30d
  const prior30d = mine.filter(e => {
    const age = now - new Date(e.ts).getTime()
    return age > d30 && age <= d30 * 2
  }).length
  const delta30d = count30d - prior30d

  // Daily buckets for last 30 days (index 0 = 30 days ago, index 29 = today)
  const daily30d = Array(30).fill(0) as number[]
  mine.forEach(e => {
    const ageDays = (now - new Date(e.ts).getTime()) / (24 * 60 * 60 * 1000)
    if (ageDays <= 30) {
      const idx = 29 - Math.floor(ageDays)   // 0 = oldest bucket
      if (idx >= 0 && idx < 30) daily30d[idx]++
    }
  })

  // Channel breakdown
  const channels: Record<Channel, number> = { website: 0, email: 0, telegram: 0 }
  mine.filter(e => inWindow(e.ts, d30)).forEach(e => {
    if (e.channel === 'website' || e.channel === 'email' || e.channel === 'telegram') {
      channels[e.channel]++
    }
  })

  return { count7d, count30d, delta7d, delta30d, daily30d, channels, seeded }
}

function emptyStats(): InboundStats {
  return {
    count7d:  0,
    count30d: 0,
    delta7d:  0,
    delta30d: 0,
    daily30d: Array(30).fill(0),
    channels: { website: 0, email: 0, telegram: 0 },
    seeded:   false,
  }
}

// ─── Tier-vs-tier insight multiplier (mock, from participants) ────────────────
// Average monthly inbound by tier — purely illustrative benchmarks.

export const TIER_BENCH: Record<string, number> = {
  Platinum: 68,
  Gold:     42,
  Silver:   24,
  Bronze:   11,
  Watch:     4,
}

export function tierInsight(tier: string): string {
  const myBench   = TIER_BENCH[tier]    ?? TIER_BENCH['Silver']
  const nextTier  = tier === 'Silver'   ? 'Gold'
                  : tier === 'Bronze'   ? 'Silver'
                  : tier === 'Gold'     ? 'Platinum'
                  : null

  if (!nextTier) return ''
  const nextBench = TIER_BENCH[nextTier] ?? myBench
  const mult      = (nextBench / myBench).toFixed(1)
  return `Участники тира ${nextTier} получают в среднем в ${mult}× больше обращений, чем ${tier}`
}
