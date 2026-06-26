'use client'

import { useState } from 'react'
import { Search, Loader2, Building2, Plus, ChevronRight, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  mockSearch,
  mockSubmitClaim,
  validateSearchQuery,
  validateClaimRequest,
  type SearchResult,
  type FieldError,
  type RequestedLevel,
  type ClaimResponse,
} from '@/lib/claim-data'
import { ANCHOR_ROLE_CODES } from '@/lib/catalog-data'
import type { RoleCode } from '@/lib/catalog-data'

interface StepFindProps {
  onSelect: (result: SearchResult) => void
  onClaimSubmit: (response: ClaimResponse) => void
}

const LEVEL_OPTIONS: { value: RequestedLevel; label: string; description: string }[] = [
  { value: 'L1', label: 'Базовая',       description: 'Со слов компании + проверка домена' },
  { value: 'L2', label: 'По документам', description: 'Сверяем документы и владельца (бенефициара)' },
  { value: 'L3', label: 'Полная',        description: 'Глубокая проверка с выездом' },
]

function FieldErrorMsg({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium mt-1" style={{ color: '#d8351e' }}>
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  )
}

export function StepFind({ onSelect, onClaimSubmit }: StepFindProps) {
  const [query, setQuery]                     = useState('')
  const [results, setResults]                 = useState<SearchResult[] | null>(null)
  const [searchLoading, setSearchLoading]     = useState(false)
  const [searchErrors, setSearchErrors]       = useState<FieldError>({})
  const [searched, setSearched]               = useState(false)

  // Fields shown after a profile is selected
  const [selected, setSelected]               = useState<SearchResult | null>(null)
  const [contact, setContact]                 = useState('')
  const [level, setLevel]                     = useState<RequestedLevel | ''>('')
  const [fieldErrors, setFieldErrors]         = useState<FieldError>({})
  const [submitLoading, setSubmitLoading]     = useState(false)
  const [serverError, setServerError]         = useState<string | null>(null)

  async function handleSearch() {
    const errs = validateSearchQuery(query)
    setSearchErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSearchLoading(true)
    setSearched(true)
    setSelected(null)
    try {
      const res = await mockSearch(query)
      setResults(res)
    } finally {
      setSearchLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  function handleSelect(result: SearchResult) {
    setSelected(result)
    // also notify parent (keeps step 1 active while contact/level are filled)
    onSelect(result)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateClaimRequest(contact, level)
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitLoading(true)
    setServerError(null)
    try {
      const response = await mockSubmitClaim({
        participant_id: selected && selected.id !== 'p-new' ? selected.id : undefined,
        contact,
        requested_level: level as RequestedLevel,
      })
      if (response.status === 'rejected') {
        setServerError(
          response.rejection_reason ??
          'Заявление отклонено. Укажите request_id при обращении в поддержку: ' + response.request_id,
        )
      } else {
        onClaimSubmit(response)
      }
    } catch {
      setServerError('Ошибка сети. Попробуйте ещё раз.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[#061b31]">Найти или создать профиль</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Введите название компании, домен или ID участника для поиска в реестре PeptideTrust.
          Если профиля ещё нет — выберите «Создать новый».
        </p>
      </div>

      {/* Search field */}
      <div className="space-y-1.5">
        <label htmlFor="profile-search" className="text-sm font-medium text-[#061b31]">
          Поиск профиля
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="profile-search"
              placeholder="Meridian Capital, company.io, p-001…"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                if (searchErrors.query) setSearchErrors({})
              }}
              onKeyDown={handleKeyDown}
              aria-invalid={!!searchErrors.query}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={searchLoading}
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 px-4"
          >
            {searchLoading ? <Loader2 className="size-4 animate-spin" /> : 'Найти'}
          </Button>
        </div>
        {searchErrors.query && <FieldErrorMsg message={searchErrors.query} />}
      </div>

      {/* Search results */}
      {searchLoading && (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!searchLoading && results !== null && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="rounded-xl border border-border bg-neutral-25 px-4 py-5 text-center">
              <p className="text-sm text-muted-foreground">Профиль не найден — создайте новый ниже.</p>
            </div>
          ) : (
            <ul className="space-y-2" role="listbox" aria-label="Результаты поиска">
              {results.map(result => (
                <SearchResultRow
                  key={result.id}
                  result={result}
                  isSelected={selected?.id === result.id}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Create new — always visible after first search */}
      {searched && !searchLoading && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Профиля ещё нет в реестре?</p>
          <button
            type="button"
            onClick={() => {
              const newProfile: SearchResult = {
                id: 'p-new', display_name: 'Новый профиль', role_code: '—', jurisdiction: '—', status: 'provisional',
              }
              handleSelect(newProfile)
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/40',
              'bg-[oklch(93%_0.04_274_/_0.4)] px-4 py-3.5 text-left',
              'transition-colors hover:border-primary/60 hover:bg-accent',
              selected?.id === 'p-new' && 'border-primary/70 bg-accent',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Plus className="size-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">Создать новый профиль</p>
              <p className="text-xs text-muted-foreground">Зарегистрировать компанию в реестре PeptideTrust</p>
            </div>
            {selected?.id === 'p-new'
              ? <CheckCircle2 className="ml-auto size-4 shrink-0 text-primary" />
              : <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
            }
          </button>
        </div>
      )}

      {/* Contact + level + submit — appear after a profile is selected */}
      {selected && (
        <div className="space-y-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Данные заявки
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-primary hover:underline"
            >
              Изменить профиль
            </button>
          </div>

          {/* Non-anchor role soft warning */}
          {selected.id !== 'p-new' && !ANCHOR_ROLE_CODES.includes(selected.role_code as RoleCode) && (
            <div
              className="flex gap-2.5 rounded-xl px-3.5 py-3"
              style={{ background: 'rgba(201,162,39,.07)', border: '1px solid rgba(201,162,39,.28)' }}
              role="note"
            >
              <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a6800" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p className="text-xs leading-relaxed" style={{ color: '#6b4f00' }}>
                <span className="font-semibold">Эту роль мы пока оцениваем частично.</span>{' '}
                Полная проверка для неё появится позже — сейчас доступен профиль с предварительной оценкой.
              </p>
            </div>
          )}

          {/* Contact field */}
          <div className="space-y-1.5">
            <label htmlFor="claim-contact" className="text-sm font-medium text-[#061b31]">
              Контактный email или телефон <span style={{ color: '#d8351e' }}>*</span>
            </label>
            <Input
              id="claim-contact"
              type="text"
              placeholder="info@company.io или +7 900 000-00-00"
              value={contact}
              onChange={e => {
                setContact(e.target.value)
                if (fieldErrors.contact) setFieldErrors(prev => ({ ...prev, contact: undefined }))
              }}
              aria-invalid={!!fieldErrors.contact}
              aria-describedby={fieldErrors.contact ? 'contact-err' : 'contact-hint'}
              disabled={submitLoading}
              style={fieldErrors.contact ? { borderColor: '#d8351e', outlineColor: '#d8351e' } : {}}
              className="h-9 text-sm"
            />
            {fieldErrors.contact
              ? <div id="contact-err"><FieldErrorMsg message={fieldErrors.contact} /></div>
              : <p id="contact-hint" className="text-xs text-muted-foreground">Ответственное лицо компании</p>
            }
          </div>

          {/* Level select */}
          <div className="space-y-1.5">
            <label htmlFor="claim-level" className="text-sm font-medium text-[#061b31]">
              Уровень проверки <span style={{ color: '#d8351e' }}>*</span>
            </label>
            <Select
              value={level}
              onValueChange={val => {
                setLevel(val as RequestedLevel)
                if (fieldErrors.requested_level) setFieldErrors(prev => ({ ...prev, requested_level: undefined }))
              }}
              disabled={submitLoading}
            >
              <SelectTrigger
                id="claim-level"
                className="w-full h-9"
                aria-invalid={!!fieldErrors.requested_level}
                style={fieldErrors.requested_level ? { borderColor: '#d8351e' } : {}}
              >
                <SelectValue placeholder="Выберите уровень…" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col gap-0.5 py-0.5">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.requested_level && (
              <FieldErrorMsg message={fieldErrors.requested_level} />
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="flex gap-3 rounded-xl border px-4 py-3.5"
              style={{ borderColor: '#d8351e33', backgroundColor: '#d8351e0d' }}
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: '#d8351e' }} />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold" style={{ color: '#d8351e' }}>Заявка отклонена</p>
                <p className="text-xs leading-relaxed" style={{ color: '#d8351e' }}>{serverError}</p>
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <Button
            type="submit"
            disabled={submitLoading}
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
          >
            {submitLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Отправляем заявку…
              </>
            ) : (
              'Отправить заявку'
            )}
          </Button>

          {/* Пояснение про лимит оценки */}
          <p className="text-xs text-muted-foreground leading-relaxed flex gap-2">
            <Info className="size-3 shrink-0 mt-0.5 text-muted-foreground" />
            Базовую проверку можно пройти сразу, без документов. До полной проверки оценка ограничена — чем глубже проверка, тем выше доступный уровень.
          </p>
        </div>
      )}
    </form>
  )
}

function SearchResultRow({
  result,
  isSelected,
  onSelect,
}: {
  result: SearchResult
  isSelected: boolean
  onSelect: (r: SearchResult) => void
}) {
  const statusColor: Record<SearchResult['status'], string> = {
    active:      '#00b261',
    provisional: '#c9a227',
    watch:       '#d8351e',
  }
  const statusLabel: Record<SearchResult['status'], string> = {
    active:      'Действующий',
    provisional: 'Данные собираются',
    watch:       'Под вниманием',
  }

  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => onSelect(result)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border bg-card',
          'px-4 py-3 text-left transition-all',
          isSelected
            ? 'border-primary/50 shadow-stripe-sm ring-1 ring-primary/20'
            : 'border-border hover:border-primary/30 hover:shadow-stripe-sm',
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Building2 className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#061b31]">{result.display_name}</p>
          <p className="text-xs text-muted-foreground">{result.role_code} · {result.jurisdiction}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: statusColor[result.status] + '1a',
            color: statusColor[result.status],
          }}
        >
          {statusLabel[result.status]}
        </span>
        {isSelected
          ? <CheckCircle2 className="size-4 shrink-0 text-primary" />
          : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        }
      </button>
    </li>
  )
}
