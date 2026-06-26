'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Plus, AlertTriangle, Columns3, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states/empty-state'
import { CompareTable, CompareTableSkeleton } from '@/components/compare/compare-table'
import { CompareAddDialog } from '@/components/compare/compare-add-dialog'
import { type CompareParticipant } from '@/lib/compare-data'

// ─── Verified-legal filter toggle ────────────────────────────────────────────
function VerifiedLegalToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
        style={{ background: checked ? '#533afd' : '#d4dee9' }}
      >
        <span
          className="absolute h-4 w-4 rounded-full bg-white shadow-stripe-xs transition-transform duration-200"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </div>
      <span className="text-sm text-[#50617a]">Verified-Legal</span>
    </label>
  )
}

// ─── Mixed-roles warning ──────────────────────────────────────────────────────
function MixedRolesWarning() {
  return (
    <div
      className="flex items-start gap-3 rounded-[10px] border px-4 py-3"
      style={{
        background: 'rgba(201,162,39,.08)',
        borderColor: 'rgba(201,162,39,.35)',
      }}
      role="alert"
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#8a6800' }} />
      <p className="text-sm leading-relaxed" style={{ color: '#7a5500' }}>
        Участники из разных ролей — факторы несопоставимы.
        Показан пофакторный режим без итогового Score.
      </p>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────
export function ComparePageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [ids, setIds] = useState<string[]>([])
  const [participants, setParticipants] = useState<CompareParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [verifiedLegalOnly, setVerifiedLegalOnly] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Parse ids from URL
  useEffect(() => {
    const raw = searchParams.get('ids') ?? ''
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setIds(parsed)
  }, [searchParams])

  // Load participants when ids change (live data via API)
  useEffect(() => {
    if (ids.length === 0) {
      setParticipants([])
      return
    }
    let active = true
    setLoading(true)
    fetch(`/api/compare?ids=${encodeURIComponent(ids.join(','))}`)
      .then((r) => (r.ok ? r.json() : { participants: [] }))
      .then((d) => {
        if (!active) return
        setParticipants((d.participants ?? []) as CompareParticipant[])
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setParticipants([])
        setLoading(false)
      })
    return () => { active = false }
  }, [ids])

  // Sync ids → URL
  const syncUrl = useCallback(
    (nextIds: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextIds.length > 0) {
        params.set('ids', nextIds.join(','))
      } else {
        params.delete('ids')
      }
      router.replace(`/compare?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const handleAdd = (id: string) => {
    if (ids.includes(id) || ids.length >= 5) return
    const next = [...ids, id]
    setIds(next)
    syncUrl(next)
  }

  const handleRemove = (id: string) => {
    const next = ids.filter((i) => i !== id)
    setIds(next)
    syncUrl(next)
  }

  const displayed = verifiedLegalOnly
    ? participants.filter((p) => p.verified_legal)
    : participants

  const roles = new Set(displayed.map((p) => p.role_code))
  const isMixed = roles.size > 1
  const roleLabel = isMixed ? 'Разные роли' : displayed[0]?.role_label ?? ''
  const isEmpty = ids.length === 0

  return (
    <main className="min-h-screen bg-[#f8fafd]">
      {/* Page header band */}
      <div className="bg-card border-b border-[#e5edf5]" style={{ boxShadow: '0 2px 10px 0 rgba(0,55,112,.04)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[#95a4ba] mb-3">
            <Link href="/catalog" className="hover:text-[#533afd] transition-colors">Каталог</Link>
            <ChevronRight size={12} className="text-[#c8d4e0]" />
            <span className="text-[#50617a]">Сравнение</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#061b31] tracking-heading">
                Сравнение участников
              </h1>
              {!isEmpty && displayed.length > 0 && (
                <p className="text-sm text-[#64748d] mt-0.5">
                  {roleLabel}
                  {' · '}
                  {displayed.length} участник{displayed.length > 1 ? 'а' : ''}
                </p>
              )}
            </div>

            {!isEmpty && (
              <div className="flex flex-wrap items-center gap-3">
                <VerifiedLegalToggle
                  checked={verifiedLegalOnly}
                  onChange={setVerifiedLegalOnly}
                />
                {displayed.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddDialog(true)}
                    className="gap-1.5"
                  >
                    <Plus size={14} />
                    Добавить участника
                  </Button>
                )}
              </div>
            )}
          </div>

          {isMixed && !loading && displayed.length > 0 && (
            <div className="mt-3">
              <MixedRolesWarning />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isEmpty && (
          <div className="flex items-center justify-center min-h-[56vh]">
            <EmptyState
              icon={<Columns3 />}
              title="Добавьте участников для сравнения"
              description="Выберите 2–5 участников из каталога или введите их ID вручную"
              action={{ label: 'Перейти в каталог →', href: '/catalog' }}
              secondaryAction={{
                label: 'Добавить по ID',
                onClick: () => setShowAddDialog(true),
                variant: 'ghost',
              }}
              className="max-w-md mx-auto"
            />
          </div>
        )}

        {!isEmpty && loading && <CompareTableSkeleton cols={ids.length || 3} />}

        {!isEmpty && !loading && displayed.length === 0 && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <EmptyState
              icon={<ShieldCheck />}
              title="Нет участников с Verified-Legal"
              description="Снимите фильтр Verified-Legal, чтобы увидеть всех участников"
              action={{ label: 'Сбросить фильтр', onClick: () => setVerifiedLegalOnly(false), variant: 'outline' }}
              compact
              className="max-w-sm mx-auto"
            />
          </div>
        )}

        {!isEmpty && !loading && displayed.length > 0 && (
          <CompareTable
            participants={displayed}
            isMixed={isMixed}
            onRemove={handleRemove}
          />
        )}

        {!isEmpty && !loading && displayed.length > 0 && displayed.length < 5 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-1.5 text-sm text-[#95a4ba] hover:text-[#533afd] transition-colors"
            >
              <Plus size={14} />
              Добавить ещё одного участника (макс. 5)
            </button>
          </div>
        )}
      </div>

      {showAddDialog && (
        <CompareAddDialog
          existingIds={ids}
          onAdd={handleAdd}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </main>
  )
}
