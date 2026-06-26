'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { ROLE_LABELS, type Participant } from '@/lib/participants'
import { TierPill } from '@/components/catalog/tier-pill'

interface CompareAddDialogProps {
  existingIds: string[]
  onAdd: (id: string) => void
  onClose: () => void
}

interface AddCandidate {
  id: string
  display_name: string
  role_label: string
  tier: Participant['tier']
  score: number | null
}

export function CompareAddDialog({ existingIds, onAdd, onClose }: CompareAddDialogProps) {
  const [query, setQuery] = useState('')
  const [all, setAll] = useState<AddCandidate[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/participants')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((res: { data: Participant[] }) => {
        if (!active) return
        const list = res?.data ?? []
        setAll(
          list.map((p) => ({
            id: p.id,
            display_name: p.display_name,
            role_label: ROLE_LABELS[p.role_code],
            tier: p.tier,
            score: p.score,
          })),
        )
      })
      .catch(() => { if (active) setAll([]) })
    return () => { active = false }
  }, [])

  const results = all.filter(
    (p) =>
      !existingIds.includes(p.id) &&
      (p.display_name.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase()) ||
        p.role_label.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Добавить участника в сравнение"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-[#e5edf5] bg-card shadow-stripe-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5edf5] px-5 py-4">
          <span className="text-sm font-semibold text-[#061b31]">Добавить участника</span>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#95a4ba] hover:text-[#061b31] transition-colors"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: '#7d8ba4' }}
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени или ID…"
              className="w-full h-9 rounded-lg border border-[#d4dee9] bg-[#f8fafd] pl-8 pr-3 text-sm text-[#061b31] placeholder:text-[#95a4ba] outline-none focus:border-[#533afd] focus:ring-2 focus:ring-[#533afd]/20 transition-all"
            />
          </div>
        </div>

        {/* Results list */}
        <ul className="max-h-64 overflow-y-auto px-2 pb-3" role="listbox" aria-label="Результаты поиска">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[#95a4ba]">
              {query ? 'Участник не найден' : 'Все доступные участники уже добавлены'}
            </li>
          ) : (
            results.map((p) => (
              <li key={p.id} role="option" aria-selected={false}>
                <button
                  onClick={() => { onAdd(p.id); onClose() }}
                  className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-[#f8fafd]"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#061b31]">{p.display_name}</span>
                    <span className="text-[11px] text-[#95a4ba]">
                      {p.id} · {p.role_label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.score !== null && (
                      <span className="text-sm font-semibold tabular-nums text-[#3c4f69]">
                        {p.score.toFixed(1)}
                      </span>
                    )}
                    <TierPill tier={p.tier} size="sm" />
                    <Plus size={14} className="text-[#533afd]" />
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer hint */}
        <div className="border-t border-[#e5edf5] px-5 py-3">
          <p className="text-[11px] text-[#95a4ba]">
            Максимум 5 участников в одном сравнении
          </p>
        </div>
      </div>
    </>
  )
}
