'use client'

import { useState, useRef, useCallback, type FormEvent, type DragEvent } from 'react'
import { Loader2, CheckCircle, AlertCircle, Upload, FileText, X, Lock, Search } from 'lucide-react'
import Link from 'next/link'
import { StubLayout, StubCard } from '@/components/layout/stub-layout'
import { PARTICIPANTS } from '@/lib/participants'

type ReportType = '' | 'forgery' | 'fraud' | 'data_error' | 'other'
type FormState  = 'idle' | 'submitting' | 'success' | 'error'

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'forgery',    label: 'Фальсификация документов' },
  { value: 'fraud',      label: 'Мошенничество' },
  { value: 'data_error', label: 'Ошибка в данных' },
  { value: 'other',      label: 'Другое' },
]

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const ACCEPTED_EXT   = '.pdf,.png,.jpg,.jpeg'

function formatBytes(b: number) {
  return b >= 1024 * 1024
    ? (b / 1024 / 1024).toFixed(1) + ' MB'
    : (b / 1024).toFixed(0) + ' KB'
}

function generateRequestId() {
  return 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

// ── Participant autocomplete ─────────────────────────────────────────────────
function ParticipantField({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error?: string }) {
  const [query, setQuery]     = useState(value)
  const [open,  setOpen]      = useState(false)
  const [active, setActive]   = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = query.trim().length >= 1
    ? PARTICIPANTS.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase()) ||
        p.domain.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  function pick(p: typeof PARTICIPANTS[number]) {
    onChange(p.id)
    setQuery(`${p.name} (${p.id})`)
    setOpen(false)
    setActive(-1)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, matches.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(matches[active]) }
    if (e.key === 'Escape')    { setOpen(false) }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="rep-participant" className="text-sm font-medium text-neutral-700">
        Участник <span className="ml-1 font-normal text-xs text-neutral-300">(необязательно)</span>
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-300" aria-hidden />
        <input
          ref={inputRef}
          id="rep-participant"
          type="text"
          value={query}
          autoComplete="off"
          placeholder="Введите ID, домен или название участника..."
          onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          aria-invalid={!!error}
          aria-describedby={error ? 'rep-participant-err' : undefined}
          aria-autocomplete="list"
          aria-expanded={open && matches.length > 0}
          className={`w-full rounded border py-2 pl-8 pr-9 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-600/30 ${error ? 'border-error bg-error-50' : 'border-neutral-100 bg-white'}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange(''); inputRef.current?.focus() }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-neutral-50"
            aria-label="Очистить"
          >
            <X className="h-3.5 w-3.5 text-neutral-300" />
          </button>
        )}
        {open && matches.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-neutral-50 bg-white py-1 shadow-stripe-md"
          >
            {matches.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === active}
                onMouseDown={() => pick(p)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${i === active ? 'bg-brand-25' : 'bg-transparent'}`}
              >
                <div className="min-w-0">
                  <span className="font-medium truncate block text-neutral-990">{p.name}</span>
                  <span className="font-mono text-[11px] text-neutral-300">{p.id} · {p.domain}</span>
                </div>
                <span
                  className="ml-3 shrink-0 rounded-full px-2 py-px text-[11px] font-semibold"
                  style={{
                    background: p.tier === 'Platinum' ? '#e8e9ff' : p.tier === 'Gold' ? '#fff4e0' : p.tier === 'Silver' ? '#f0f2f5' : p.tier === 'Bronze' ? '#fdf3e7' : '#fdecea',
                    color:      p.tier === 'Platinum' ? '#533afd' : p.tier === 'Gold' ? '#925a00' : p.tier === 'Silver' ? '#3c4f69' : p.tier === 'Bronze' ? '#7a4500' : '#b02010',
                  }}
                >
                  {p.tier}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p id="rep-participant-err" className="text-xs text-error">{error}</p>}
    </div>
  )
}

// ── File drop zone ───────────────────────────────────────────────────────────
function EvidenceDropZone({
  file, onFile, error,
}: { file: File | null; onFile: (f: File | null) => void; error?: string }) {
  const [dragging, setDragging] = useState(false)
  const [sizeErr,  setSizeErr]  = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function accept(f: File | undefined | null) {
    if (!f) return
    if (f.size > MAX_FILE_BYTES) { setSizeErr(`Файл слишком большой (${formatBytes(f.size)}, максимум 20 MB)`); return }
    if (!ACCEPTED_TYPES.includes(f.type)) { setSizeErr('Допустимые форматы: PDF, PNG, JPG'); return }
    setSizeErr('')
    onFile(f)
  }

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    accept(e.dataTransfer.files[0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const combinedError = sizeErr || error

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">
        Доказательство <span className="ml-1 font-normal text-xs text-neutral-300">(необязательно)</span>
      </label>

      {file ? (
        <div className="flex items-center gap-3 rounded border border-neutral-100 bg-info-50 px-3 py-2.5">
          <FileText className="h-4 w-4 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-990">{file.name}</p>
            <p className="text-xs tabular-nums text-neutral-300">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => { onFile(null); setSizeErr('') }}
            className="rounded p-1 transition-colors hover:bg-neutral-50"
            aria-label="Удалить файл"
          >
            <X className="h-3.5 w-3.5 text-neutral-500" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors"
          style={{
            borderColor:      dragging ? '#533afd' : combinedError ? '#d8351e' : '#c8d8e8',
            background:       dragging ? 'rgba(83,58,253,.04)' : combinedError ? '#fdecea' : '#f8fafd',
          }}
          aria-label="Загрузить файл доказательства"
        >
          <Upload className={`h-5 w-5 ${dragging ? 'text-brand-600' : 'text-neutral-300'}`} aria-hidden />
          <div>
            <p className="text-sm font-medium text-neutral-700">
              Перетащите файл или{' '}
              <span className="text-brand-600">выберите</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-300">PDF, PNG, JPG — до 20 MB</p>
          </div>
        </div>
      )}

      {combinedError && (
        <p className="text-xs text-error">{combinedError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        className="sr-only"
        onChange={e => accept(e.target.files?.[0])}
        tabIndex={-1}
        aria-hidden
      />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [email,       setEmail]       = useState('')
  const [participant, setParticipant] = useState('')
  const [type,        setType]        = useState<ReportType>('')
  const [description, setDesc]        = useState('')
  const [file,        setFile]        = useState<File | null>(null)
  const [formState,   setForm]        = useState<FormState>('idle')
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [requestId,   setRequestId]   = useState('')

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Введите корректный email'
    }
    if (!type) e.type = 'Выберите тип нарушения'
    if (description.trim().length < 20) e.description = 'Опишите ситуацию подробнее (минимум 20 символов)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setForm('submitting')
    await new Promise(r => setTimeout(r, 1300))
    setRequestId(generateRequestId())
    setForm('success')
  }

  const inputClass = (field: string) =>
    `w-full rounded border px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-600/30 ${
      errors[field] ? 'border-error bg-error-50' : 'border-neutral-100 bg-white'
    }`

  if (formState === 'success') {
    return (
      <StubLayout>
        <title>Сообщить о нарушении — PeptideTrust</title>
        <StubCard>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'rgba(0,178,97,.12)' }}
            >
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-990">Сообщение принято</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                ID обращения:{' '}
                <span className="font-mono font-semibold tabular-nums text-brand-600">
                  {requestId}
                </span>
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Мы рассмотрим обращение в течение 72 часов и свяжемся с вами по адресу{' '}
                <span className="font-medium text-neutral-700">{email}</span>.
              </p>
            </div>
            <div className="mt-1 flex items-start gap-2 rounded-lg border border-neutral-100 bg-info-50 px-4 py-3 text-left text-xs text-neutral-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
              <span>Содержание обращения конфиденциально и не раскрывается третьим сторонам без вашего согласия.</span>
            </div>
            <Link href="/" className="mt-1 text-sm font-medium text-brand-600">← На главную</Link>
          </div>
        </StubCard>
      </StubLayout>
    )
  }

  return (
    <StubLayout>
      <title>Сообщить о нарушении — PeptideTrust</title>

      <StubCard>
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-heading text-neutral-990">
            Сообщить о нарушении
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Все сообщения конфиденциальны и рассматриваются независимой командой.
          </p>
        </div>

        {/* 72h + confidentiality informers */}
        <div className="mb-6 flex flex-col gap-2">
          <div
            className="flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm"
            style={{ border: '1px solid rgba(83,58,253,.18)', color: '#3a28c0' }}
          >
            <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Все сообщения рассматриваются в течение 72 часов.
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-info-50 px-4 py-3 text-sm text-neutral-500">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            Содержание обращения конфиденциально и не раскрывается третьим сторонам.
          </div>
        </div>

        {formState === 'error' && (
          <div
            className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700"
            style={{ border: '1px solid rgba(216,53,30,.25)' }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            Произошла ошибка. Попробуйте ещё раз.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rep-email" className="text-sm font-medium text-neutral-700">
              Email для связи
            </label>
            <input
              id="rep-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
              placeholder="you@company.com"
              className={inputClass('email')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'rep-email-err' : undefined}
              autoComplete="email"
            />
            {errors.email && (
              <p id="rep-email-err" className="text-xs text-error">{errors.email}</p>
            )}
          </div>

          {/* Participant autocomplete */}
          <ParticipantField
            value={participant}
            onChange={v => { setParticipant(v); setErrors(p => ({ ...p, participant: '' })) }}
            error={errors.participant}
          />

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rep-type" className="text-sm font-medium text-neutral-700">
              Тип нарушения
            </label>
            <select
              id="rep-type"
              value={type}
              onChange={e => { setType(e.target.value as ReportType); setErrors(p => ({ ...p, type: '' })) }}
              className={inputClass('type')}
              aria-invalid={!!errors.type}
              aria-describedby={errors.type ? 'rep-type-err' : undefined}
            >
              <option value="" disabled>Выберите тип...</option>
              {REPORT_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            {errors.type && (
              <p id="rep-type-err" className="text-xs text-error">{errors.type}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rep-desc" className="text-sm font-medium text-neutral-700">
              Описание
            </label>
            <textarea
              id="rep-desc"
              value={description}
              onChange={e => { setDesc(e.target.value); setErrors(p => ({ ...p, description: '' })) }}
              placeholder="Опишите нарушение подробно: участник, дата, характер нарушения..."
              rows={5}
              className={`${inputClass('description')} resize-none`}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'rep-desc-err' : undefined}
            />
            <div className="flex items-center justify-between">
              {errors.description
                ? <p id="rep-desc-err" className="text-xs text-error">{errors.description}</p>
                : <span />
              }
              <p className="text-xs tabular-nums text-neutral-300">{description.length} симв.</p>
            </div>
          </div>

          {/* Evidence file */}
          <EvidenceDropZone
            file={file}
            onFile={setFile}
            error={errors.file}
          />

          <button
            type="submit"
            disabled={formState === 'submitting'}
            className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded bg-brand-600 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {formState === 'submitting' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Отправка...</>
            ) : 'Отправить'}
          </button>

          {/* Legal status + confidentiality note */}
          {/* TODO: на ревью юриста */}
          <p className="text-xs leading-relaxed text-neutral-300">
            PeptideTrust — нейтральный информационный реестр; поданные жалобы
            используются исключительно для информационных целей реестра и не передаются
            третьим лицам без согласия заявителя. Идентификатор заявителя остаётся
            конфиденциальным. Обработка данных осуществляется в соответствии с{' '}
            <a href="/legal/privacy" className="underline hover:no-underline text-neutral-400">
              Политикой конфиденциальности
            </a>
            {' '}(GDPR).
          </p>
        </form>
      </StubCard>
    </StubLayout>
  )
}
