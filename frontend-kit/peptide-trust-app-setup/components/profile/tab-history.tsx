'use client'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { TierPill } from '@/components/catalog/tier-pill'
import type { ParticipantProfile } from '@/lib/profile-data'
import { FACTOR_LABELS } from '@/lib/catalog-data'
import type { Tier } from '@/lib/catalog-data'

// Derive tier from score — strict thresholds: Platinum 88–100, Gold 72–87, Silver 55–71, Bronze 35–54, Watch <35
function scoreToTier(score: number): Tier {
  if (score >= 88) return 'Platinum'
  if (score >= 72) return 'Gold'
  if (score >= 55) return 'Silver'
  if (score >= 35) return 'Bronze'
  return 'Watch'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface TabHistoryProps {
  profile: ParticipantProfile
}

export function TabHistory({ profile }: TabHistoryProps) {
  const events = profile.score_events

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center shadow-stripe-xs">
        <p className="text-sm text-muted-foreground">
          Нет записей о расчётах Score
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Снимки появятся после первого расчёта Trust Score
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Anchor hash of latest */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
        style={{ background: 'rgba(83,58,253,.06)', border: '1px solid rgba(83,58,253,.12)' }}
      >
        <span className="text-muted-foreground">Последний якорь:</span>
        <span className="font-mono font-medium text-foreground/80">
          {profile.latest_anchor_hash}
        </span>
        <span className="ml-auto text-muted-foreground">algo {profile.algo_version}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-stripe-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-neutral-25/60">
              <TableHead className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Score
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Тир
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Дом. фактор
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Algo
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Якорь
              </TableHead>
              <TableHead className="pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Дата
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev, idx) => {
              const tier = scoreToTier(ev.score)
              const factorLabel = ev.dominant_factor
                ? FACTOR_LABELS[ev.dominant_factor]
                : 'Сбалансирован'
              const isLatest = idx === 0

              return (
                <TableRow
                  key={ev.id}
                  className={isLatest ? 'bg-accent/30' : undefined}
                >
                  {/* Score */}
                  <TableCell className="pl-4">
                    <span className="tabular-nums font-mono text-base font-semibold text-foreground">
                      {ev.score.toFixed(1)}
                    </span>
                    {isLatest && (
                      <span
                        className="ml-2 rounded-full px-1.5 py-px text-[10px] font-medium"
                        style={{
                          background: 'rgba(83,58,253,.10)',
                          color: '#3a28c0',
                        }}
                      >
                        актуальный
                      </span>
                    )}
                  </TableCell>

                  {/* Tier */}
                  <TableCell>
                    <TierPill tier={tier} size="sm" />
                  </TableCell>

                  {/* Dominant factor */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-medium text-foreground/80">
                        {ev.dominant_factor ?? '—'}
                      </span>
                      {ev.dominant_factor && (
                        <span className="text-[11px] text-muted-foreground">
                          {factorLabel}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Algo version */}
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {ev.algo_version}
                    </span>
                  </TableCell>

                  {/* Anchor hash */}
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {ev.anchor_hash}
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                    {formatDate(ev.computed_at)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
