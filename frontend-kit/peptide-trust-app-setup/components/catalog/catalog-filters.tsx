'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tier, RoleCode, DominantFactor, ParticipantStatus } from '@/lib/catalog-data'
import { ROLE_LABELS, FACTOR_LABELS, ANCHOR_ROLE_CODES } from '@/lib/catalog-data'

export interface CatalogFilters {
  role:           RoleCode | 'ALL'
  tier:           Tier | 'ALL'
  factor:         DominantFactor | 'ALL'
  status:         ParticipantStatus | 'ALL'
  verifiedLegal:  boolean
  query:          string
}

interface CatalogFiltersProps {
  filters:   CatalogFilters
  onChange:  (next: CatalogFilters) => void
  total:     number
}

// ─── Generic pill-select ─────────────────────────────────────────────────────

interface PillSelectProps<T extends string> {
  label:    string
  value:    T | 'ALL'
  options:  { value: T; label: string }[]
  onChange: (v: T | 'ALL') => void
}

function PillSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: PillSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = value !== 'ALL'

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const selectedLabel = isActive
    ? options.find((o) => o.value === value)?.label ?? label
    : label

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all duration-150 select-none',
          isActive
            ? 'border text-white'
            : 'border hover:border-[#95a4ba]'
        )}
        style={
          isActive
            ? {
                background:   '#533afd',
                borderColor:  '#4032c8',
                color:        '#ffffff',
              }
            : {
                background:   '#ffffff',
                borderColor:  '#d4dee9',
                color:        '#50617a',
              }
        }
      >
        <span className="max-w-[120px] truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl bg-card py-1"
          style={{
            boxShadow:  '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)',
            border:     '1px solid rgba(212,222,233,.8)',
          }}
        >
          <button
            type="button"
            onClick={() => { onChange('ALL'); setOpen(false) }}
            className={cn(
              'flex w-full items-center px-3 py-1.5 text-sm transition-colors duration-100',
              value === 'ALL'
                ? 'font-medium'
                : 'hover:bg-muted'
            )}
            style={value === 'ALL' ? { color: '#533afd' } : { color: '#273951' }}
          >
            Все
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'flex w-full items-center px-3 py-1.5 text-sm transition-colors duration-100',
                value === opt.value
                  ? 'font-medium'
                  : 'hover:bg-muted'
              )}
              style={value === opt.value ? { color: '#533afd' } : { color: '#273951' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Role options — anchor roles first, then non-anchor ──────────────────────

const ROLE_OPTIONS: { value: RoleCode; label: string; isAnchor: boolean }[] = [
  ...(Object.entries(ROLE_LABELS) as [RoleCode, string][])
    .filter(([v]) => ANCHOR_ROLE_CODES.includes(v))
    .map(([value, label]) => ({ value, label, isAnchor: true })),
  ...(Object.entries(ROLE_LABELS) as [RoleCode, string][])
    .filter(([v]) => !ANCHOR_ROLE_CODES.includes(v))
    .map(([value, label]) => ({ value, label, isAnchor: false })),
]

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'Platinum', label: 'Platinum' },
  { value: 'Gold',     label: 'Gold' },
  { value: 'Silver',   label: 'Silver' },
  { value: 'Bronze',   label: 'Bronze' },
  { value: 'Watch',    label: 'Watch' },
]

const FACTOR_OPTIONS = (
  Object.entries(FACTOR_LABELS) as [NonNullable<DominantFactor>, string][]
).map(([value, label]) => ({ value, label }))

const STATUS_OPTIONS: { value: ParticipantStatus; label: string }[] = [
  { value: 'ACTIVE',      label: 'Действующий' },
  { value: 'PROVISIONAL', label: 'Данные собираются' },
  { value: 'SUSPENDED',   label: 'Не заявлен' },
]

// ─── Role pill select with anchor/non-anchor grouping ────────────────────────

function RolePillSelect({
  value,
  onChange,
}: {
  value: RoleCode | 'ALL'
  onChange: (v: RoleCode | 'ALL') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = value !== 'ALL'
  const selectedLabel = isActive ? ROLE_LABELS[value] : 'Роль'

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const anchors    = ROLE_OPTIONS.filter(o => o.isAnchor)
  const nonAnchors = ROLE_OPTIONS.filter(o => !o.isAnchor)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all duration-150 select-none border"
        style={isActive
          ? { background: '#533afd', borderColor: '#4032c8', color: '#fff' }
          : { background: '#fff', borderColor: '#d4dee9', color: '#50617a' }
        }
      >
        <span className="max-w-[130px] truncate">{selectedLabel}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-xl bg-card py-1"
          style={{ boxShadow: '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)', border: '1px solid rgba(212,222,233,.8)' }}
        >
          <button type="button" onClick={() => { onChange('ALL'); setOpen(false) }}
            className="flex w-full items-center px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            style={{ color: value === 'ALL' ? '#533afd' : '#273951', fontWeight: value === 'ALL' ? 600 : 400 }}
          >
            Все роли
          </button>

          {/* Anchor group */}
          <div className="mx-3 mt-1 mb-0.5 flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#5b78a8' }}>
              Полностью оцениваются
            </span>
            <div className="flex-1 border-t" style={{ borderColor: 'rgba(91,120,168,.20)' }} />
          </div>
          {anchors.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              style={{ color: value === opt.value ? '#533afd' : '#273951', fontWeight: value === opt.value ? 600 : 400 }}
            >
              {opt.label}
            </button>
          ))}

          {/* Non-anchor group */}
          <div className="mx-3 mt-1 mb-0.5 flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#95a4ba' }}>
              Данные собираются
            </span>
            <div className="flex-1 border-t" style={{ borderColor: 'rgba(148,164,186,.25)' }} />
          </div>
          {nonAnchors.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              style={{ color: value === opt.value ? '#533afd' : '#64748d', fontWeight: value === opt.value ? 600 : 400 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main filter bar ──────────────────────────────────────────────────────────

export function CatalogFiltersBar({ filters, onChange, total }: CatalogFiltersProps) {
  const hasActiveFilters =
    filters.role !== 'ALL' ||
    filters.tier !== 'ALL' ||
    filters.factor !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.verifiedLegal ||
    filters.query !== ''

  function reset() {
    onChange({ role: 'ALL', tier: 'ALL', factor: 'ALL', status: 'ALL', verifiedLegal: false, query: '' })
  }

  return (
    <div className="space-y-3">
      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pill selects */}
        <RolePillSelect
          value={filters.role}
          onChange={(v) => onChange({ ...filters, role: v })}
        />

        <PillSelect<Tier>
          label="Тир"
          value={filters.tier}
          options={TIER_OPTIONS}
          onChange={(v) => onChange({ ...filters, tier: v })}
        />

        <PillSelect<NonNullable<DominantFactor>>
          label="Сильная сторона"
          value={filters.factor as NonNullable<DominantFactor> | 'ALL'}
          options={FACTOR_OPTIONS}
          onChange={(v) => onChange({ ...filters, factor: v === 'ALL' ? 'ALL' : v })}
        />

        <PillSelect<ParticipantStatus>
          label="Статус"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(v) => onChange({ ...filters, status: v })}
        />

        {/* Verified-legal toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...filters, verifiedLegal: !filters.verifiedLegal })}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all duration-150 select-none'
          )}
          style={
            filters.verifiedLegal
              ? {
                  background:  '#533afd',
                  borderColor: '#4032c8',
                  color:       '#ffffff',
                }
              : {
                  background:  '#ffffff',
                  borderColor: '#d4dee9',
                  color:       '#50617a',
                }
          }
        >
          Юр. статус подтверждён
        </button>

        {/* Search field */}
        <div className="relative ml-auto min-w-[200px] flex-1 max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: '#95a4ba' }}
          />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Имя или домен..."
            className="h-8 w-full rounded-full border bg-white pl-8 pr-8 text-sm outline-none transition-all duration-150 placeholder:text-[#95a4ba] focus:ring-2 focus:ring-ring/40"
            style={{
              borderColor: '#d4dee9',
              color:       '#061b31',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#533afd')}
            onBlur={(e)  => (e.currentTarget.style.borderColor = '#d4dee9')}
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, query: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#95a4ba' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Result count + reset */}
      <div className="flex items-center gap-3">
        <p className="text-sm" style={{ color: '#64748d' }}>
          {total === 0 ? 'Нет результатов' : `${total} участник${total === 1 ? '' : total < 5 ? 'а' : 'ов'}`}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-sm text-brand-600 transition-colors duration-150 hover:text-brand-700"
          >
            <X className="h-3.5 w-3.5" />
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}
