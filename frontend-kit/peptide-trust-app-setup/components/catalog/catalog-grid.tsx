'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Columns3, X } from 'lucide-react'
import { TIER_ORDER, ANCHOR_ROLE_CODES } from '@/lib/catalog-data'
import type { Participant } from '@/lib/catalog-data'
import type { CatalogFilters } from '@/components/catalog/catalog-filters'
import { CatalogFiltersBar } from '@/components/catalog/catalog-filters'
import { ParticipantCard } from '@/components/catalog/participant-card'
import { ParticipantCardSkeleton } from '@/components/catalog/participant-card-skeleton'
import { ErrorBlock } from '@/components/states/error-block'

const PAGE_SIZE = 8
const COMPARE_MAX = 5

function generateRequestId() {
  return 'req_' + Math.random().toString(36).slice(2, 10)
}

interface CatalogGridProps {
  /** Participants resolved server-side (DB or mock fallback). */
  participants: Participant[]
  /** Seed search query from the landing-page search (?q=) */
  initialQuery?: string
}

export function CatalogGrid({ participants, initialQuery = '' }: CatalogGridProps) {
  const router = useRouter()

  const [filters, setFilters] = useState<CatalogFilters>({
    role:          'ALL',
    tier:          'ALL',
    factor:        'ALL',
    status:        'ALL',
    verifiedLegal: false,
    query:         initialQuery,
  })

  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [requestId] = useState(() => generateRequestId())
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setLoadState('loading')
    const t = setTimeout(() => {
      try {
        if (!participants || participants.length === 0) throw new Error('empty')
        setLoadState('loaded')
      } catch {
        setLoadState('error')
      }
    }, 700)
    return () => clearTimeout(t)
  }, [retryCount])

  const loading = loadState === 'loading'

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters])

  // Filter + sort participants
  const filtered = useMemo(() => {
    return participants
      .filter((p) => {
        if (filters.role !== 'ALL' && p.role_code !== filters.role) return false
        if (filters.tier !== 'ALL' && p.tier !== filters.tier) return false
        if (filters.status !== 'ALL' && p.status !== filters.status) return false
        if (filters.factor !== 'ALL') {
          if (filters.factor === null) {
            if (!p.is_balanced) return false
          } else {
            if (p.dominant_factor !== filters.factor) return false
          }
        }
        if (filters.verifiedLegal && !p.verified_legal) return false
        if (filters.query) {
          const q = filters.query.toLowerCase()
          if (
            !p.display_name.toLowerCase().includes(q) &&
            !p.domain.toLowerCase().includes(q)
          ) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        const ta = TIER_ORDER[a.tier]
        const tb = TIER_ORDER[b.tier]
        if (ta !== tb) return ta - tb
        // Within same tier: anchor roles first
        const aa = ANCHOR_ROLE_CODES.includes(a.role_code) ? 0 : 1
        const ab = ANCHOR_ROLE_CODES.includes(b.role_code) ? 0 : 1
        if (aa !== ab) return aa - ab
        const sa = a.score ?? -1
        const sb = b.score ?? -1
        return sb - sa
      })
  }, [filters, participants])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function loadMore() {
    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((v) => v + PAGE_SIZE)
      setLoadingMore(false)
    }, 400)
  }

  function handleCompareToggle(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= COMPARE_MAX) return prev
      return [...prev, id]
    })
  }

  function handleCompareGo() {
    if (compareIds.length < 2) return
    router.push(`/compare?ids=${compareIds.join(',')}`)
  }

  const atMax = compareIds.length >= COMPARE_MAX

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <CatalogFiltersBar
        filters={filters}
        onChange={setFilters}
        total={filtered.length}
      />

      {/* Grid */}
      {loadState === 'error' ? (
        <ErrorBlock
          requestId={requestId}
          onRetry={() => setRetryCount(c => c + 1)}
          compact
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ParticipantCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <CatalogEmptyState
          hasActiveFilters={
            filters.role !== 'ALL' ||
            filters.tier !== 'ALL' ||
            filters.factor !== 'ALL' ||
            filters.status !== 'ALL' ||
            filters.verifiedLegal ||
            filters.query !== ''
          }
          onReset={() =>
            setFilters({
              role: 'ALL', tier: 'ALL', factor: 'ALL',
              status: 'ALL', verifiedLegal: false, query: '',
            })
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <ParticipantCard
                key={p.id}
                participant={p}
                compareSelected={compareIds.includes(p.id)}
                compareDisabled={atMax}
                onCompareToggle={handleCompareToggle}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full rounded-[10px] text-sm font-medium"
                style={{ borderColor: '#d4dee9', color: '#3c4f69' }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  `Показать ещё (${filtered.length - visibleCount})`
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Sticky compare bar */}
      {compareIds.length > 0 && (
        <CompareBar
          ids={compareIds}
          participants={participants}
          onRemove={(id) => setCompareIds((prev) => prev.filter((i) => i !== id))}
          onClear={() => setCompareIds([])}
          onGo={handleCompareGo}
          atMax={atMax}
        />
      )}
    </div>
  )
}

// ─── Sticky compare bar ───────────────────────────────────────────────────────
interface CompareBarProps {
  ids: string[]
  participants: Participant[]
  onRemove: (id: string) => void
  onClear: () => void
  onGo: () => void
  atMax: boolean
}

function CompareBar({ ids, participants, onRemove, onClear, onGo, atMax }: CompareBarProps) {
  // Resolve display names for chips
  const selected = useMemo(
    () => ids.map((id) => participants.find((p) => p.id === id)).filter(Boolean),
    [ids, participants]
  ) as Participant[]

  const canCompare = ids.length >= 2

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-2xl"
      role="region"
      aria-label="Панель сравнения"
    >
      <div
        className="flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 shadow-2xl"
        style={{
          background: '#061b31',
          border: '1px solid rgba(255,255,255,.08)',
          boxShadow: '0 8px 32px 0 rgba(6,27,49,.40), 0 2px 8px 0 rgba(0,0,0,.20)',
        }}
      >
        {/* Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selected.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 rounded-full pl-2.5 pr-1.5 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(255,255,255,.10)', color: '#e0e9f4' }}
            >
              <span className="max-w-[100px] truncate">{p.display_name}</span>
              <button
                onClick={() => onRemove(p.id)}
                aria-label={`Убрать ${p.display_name}`}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/20"
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}

          {/* Placeholder slots */}
          {!atMax && ids.length < 2 && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>
              Выберите ещё {2 - ids.length} участника
            </span>
          )}
          {atMax && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>
              Максимум 5
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-xs text-white/45 transition-colors hover:text-white/75"
          >
            Сбросить
          </button>

          <button
            onClick={onGo}
            disabled={!canCompare}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-opacity"
            style={{
              background: canCompare ? '#533afd' : 'rgba(83,58,253,.35)',
              color: '#fff',
              cursor: canCompare ? 'pointer' : 'not-allowed',
              opacity: canCompare ? 1 : 0.6,
            }}
            title={!canCompare ? 'Выберите минимум 2 участника' : undefined}
          >
            <Columns3 size={14} />
            Сравнить ({ids.length})
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
interface CatalogEmptyStateProps {
  hasActiveFilters?: boolean
  onReset?: () => void
}

function CatalogEmptyState({ hasActiveFilters, onReset }: CatalogEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[16px] bg-card py-20 text-center"
      style={{
        boxShadow: '0 2px 10px 0 rgba(0,55,112,.06), 0 1px 4px 0 rgba(0,59,137,.04)',
        border:    '1px solid rgba(212,222,233,.6)',
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: '#e8e9ff' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#533afd"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <p
        className="mt-4 text-base font-medium"
        style={{ color: '#1a2c44', letterSpacing: '-0.01em' }}
      >
        Ничего не найдено
      </p>
      <p className="mt-1 max-w-xs text-sm" style={{ color: '#64748d' }}>
        {hasActiveFilters
          ? 'Под выбранные фильтры не попал ни один участник.'
          : 'В реестре пока нет участников.'}
      </p>
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="mt-5 rounded-[10px] border border-brand-600/20 bg-brand-600/8 px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-600/15"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  )
}
