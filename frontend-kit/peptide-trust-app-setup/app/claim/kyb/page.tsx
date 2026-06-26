'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock,
  Info, Loader2, Lock, Paperclip, X,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ClaimStepper } from '@/components/claim/claim-stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  mockKybSubmit, validateKybRequest,
  type KybRequest, type KybFieldError,
  type RequestedLevel, type Jurisdiction, type ClaimResponse,
} from '@/lib/claim-data'

// ── Constants ──────────────────────────────────────────────────────────────
const JURISDICTION_OPTIONS: { value: Jurisdiction; label: string }[] = [
  { value: 'RU',    label: 'Россия (РФ)' },
  { value: 'KZ',    label: 'Казахстан (KZ)' },
  { value: 'BY',    label: 'Беларусь (BY)' },
  { value: 'OTHER', label: 'Другая юрисдикция' },
]

const LEVEL_OPTIONS: { value: RequestedLevel; label: string; short: string; time: string; ceiling: string }[] = [
  { value: 'L1', label: 'Базовая — со слов компании',     short: 'Базовая',      time: 'Мгновенно',       ceiling: 'оценка до 65 (уровень Silver)' },
  { value: 'L2', label: 'По документам — сверяем бумаги',  short: 'По документам', time: '1–3 рабочих дня', ceiling: 'оценка до 80 (уровень Gold)' },
  { value: 'L3', label: 'Полная — с выездом',              short: 'Полная',       time: 'По согласованию', ceiling: 'оценка до 100 (уровень Platinum)' },
]

const ACCEPTED_DOC_TYPES = [
  'ОГРН / выписка из ЕГРЮЛ',
  'Устав / учредительные документы',
  'Лицензия / разрешение',
  'Документ владельца (бенефициара)',
]

// ── Sub-components ─────────────────────────────────────────────────────────
function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium mt-1.5" style={{ color: '#d8351e' }}>
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  )
}

function inputStyle(hasError?: boolean) {
  return hasError
    ? { borderColor: '#d8351e', boxShadow: '0 0 0 3px rgba(216,53,30,.10)' }
    : {}
}

// ── Success state ──────────────────────────────────────────────────────────
function KybSuccess({ response }: { response: ClaimResponse }) {
  const isInstant  = response.requested_level === 'L1'
  const estimated  = response.estimated_provisional_at
    ? new Date(response.estimated_provisional_at).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Green informer */}
      <div
        className="flex gap-3 rounded-xl border px-4 py-4"
        style={{ borderColor: '#00b26133', backgroundColor: '#00b2610d' }}
        role="status"
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: '#00b261' }} />
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: '#006d3d' }}>
            Документы отправлены, ожидайте
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#006d3d' }}>
            {isInstant
              ? 'Базовая проверка выполнена автоматически. Профиль добавлен в реестр со статусом «данные собираются».'
              : `Профиль появится в реестре ориентировочно: ${estimated ?? '—'}. Мы уведомим вас по email.`}
          </p>
        </div>
      </div>

      {/* Технические детали — для поддержки, прячем под спойлер */}
      <details className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-muted-foreground">
          Технические детали заявки
        </summary>
        <div className="divide-y divide-border border-t border-border text-sm">
          {[
            { label: 'Номер заявки',       value: response.claim_id },
            { label: 'ID профиля',         value: response.participant_id },
            { label: 'Уровень проверки',   value: response.requested_level },
            { label: 'Статус',             value: 'на проверке' },
            { label: 'ID запроса',         value: response.request_id },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 gap-4">
              <span className="text-xs text-muted-foreground shrink-0">{label}</span>
              <span className="text-xs font-mono font-medium text-right text-[#061b31] truncate">{value}</span>
            </div>
          ))}
        </div>
      </details>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full h-10 font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/dashboard">Перейти в кабинет</Link>
        </Button>
        <Button asChild variant="outline" className="w-full h-10 text-sm">
          <Link href="/catalog">В каталог участников</Link>
        </Button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ClaimKybPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [legalName, setLegalName]         = useState('')
  const [jurisdiction, setJurisdiction]   = useState<Jurisdiction | ''>('')
  const [level, setLevel]                 = useState<RequestedLevel | ''>('')
  const [files, setFiles]                 = useState<File[]>([])
  const [errors, setErrors]               = useState<KybFieldError>({})
  const [loading, setLoading]             = useState(false)
  const [serverError, setServerError]     = useState<string | null>(null)
  const [success, setSuccess]             = useState<ClaimResponse | null>(null)

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...picked.filter(f => !existing.has(f.name))]
    })
    // reset input so same file can be re-added after removal
    e.target.value = ''
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req: KybRequest = { legal_name: legalName, jurisdiction, requested_level: level, documents: files.map(f => f.name) }
    const errs = validateKybRequest(req)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setServerError(null)
    try {
      const response = await mockKybSubmit(req)
      setSuccess(response)
    } catch {
      setServerError('Ошибка сети. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <title>Проверка компании — PeptideTrust</title>
      <Header />
      <main className="min-h-screen py-10 px-4" style={{ background: '#f8fafd' }}>
        <div className="mx-auto max-w-[580px]">

          {/* Back link */}
          <Link
            href="/claim"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Назад к шагу 1
          </Link>

          {/* Page heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#061b31]">
              Проверка компании
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Подтвердите, что компания ваша. Чем глубже проверка, тем выше доступный
              уровень оценки доверия.
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl border border-border bg-white overflow-hidden"
            style={{ boxShadow: '0 4px 16px rgba(6,27,49,.08), 0 1px 3px rgba(6,27,49,.06)' }}
          >
            <div className="px-6 py-8 sm:px-8">

              {/* Stepper — step 2 active */}
              <ClaimStepper currentStep={2} />

              {success ? (
                <KybSuccess response={success} />
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">

                  {/* Section title */}
                  <div>
                    <h2 className="text-base font-semibold text-[#061b31]">Данные компании</h2>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Поля, отмеченные <span style={{ color: '#d8351e' }}>*</span>, обязательны.
                    </p>
                  </div>

                  {/* Legal name */}
                  <div className="space-y-1.5">
                    <label htmlFor="kyb-legal-name" className="text-sm font-medium text-[#061b31]">
                      Название компании <span style={{ color: '#d8351e' }}>*</span>
                    </label>
                    <Input
                      id="kyb-legal-name"
                      type="text"
                      placeholder='ООО "АльфаПеп" или AlphaPep Lab Ltd.'
                      value={legalName}
                      onChange={e => {
                        setLegalName(e.target.value)
                        if (errors.legal_name) setErrors(p => ({ ...p, legal_name: undefined }))
                      }}
                      aria-invalid={!!errors.legal_name}
                      disabled={loading}
                      className="h-9 text-sm"
                      style={inputStyle(!!errors.legal_name)}
                    />
                    {errors.legal_name && <FieldError message={errors.legal_name} />}
                  </div>

                  {/* Jurisdiction */}
                  <div className="space-y-1.5">
                    <label htmlFor="kyb-jurisdiction" className="text-sm font-medium text-[#061b31]">
                      Юрисдикция <span style={{ color: '#d8351e' }}>*</span>
                    </label>
                    <Select
                      value={jurisdiction}
                      onValueChange={val => {
                        setJurisdiction(val as Jurisdiction)
                        if (errors.jurisdiction) setErrors(p => ({ ...p, jurisdiction: undefined }))
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="kyb-jurisdiction"
                        className="w-full h-9"
                        aria-invalid={!!errors.jurisdiction}
                        style={inputStyle(!!errors.jurisdiction)}
                      >
                        <SelectValue placeholder="Выберите юрисдикцию…" />
                      </SelectTrigger>
                      <SelectContent>
                        {JURISDICTION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.jurisdiction && <FieldError message={errors.jurisdiction} />}
                  </div>

                  {/* Document upload */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#061b31]">
                      Документы
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(необязательно для L1)</span>
                    </p>

                    {/* Accepted types hint */}
                    <div
                      className="rounded-xl border px-4 py-3 space-y-1.5"
                      style={{ borderColor: '#e5edf5', background: '#f8fafd' }}
                    >
                      <p className="text-xs font-medium text-[#3c4f69] flex items-center gap-1.5">
                        <Info className="size-3.5 shrink-0 text-[#533afd]" />
                        Принимаемые документы
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                        {ACCEPTED_DOC_TYPES.map(t => (
                          <li key={t} className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="size-1 rounded-full bg-muted-foreground/40 shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Drop zone / picker */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                      style={{ borderColor: '#d4dee9' }}
                    >
                      <Paperclip className="size-4 shrink-0" />
                      Прикрепить файлы (PDF, JPG, PNG)
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFilePick}
                    />

                    {/* Attached files list */}
                    {files.length > 0 && (
                      <ul className="space-y-1.5">
                        {files.map(f => (
                          <li
                            key={f.name}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs"
                          >
                            <span className="flex items-center gap-1.5 truncate text-[#3c4f69]">
                              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                              <span className="truncate">{f.name}</span>
                              <span className="shrink-0 text-muted-foreground">
                                ({(f.size / 1024).toFixed(0)} KB)
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(f.name)}
                              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Удалить ${f.name}`}
                            >
                              <X className="size-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Level select */}
                  <div className="space-y-1.5">
                    <label htmlFor="kyb-level" className="text-sm font-medium text-[#061b31]">
                      Уровень проверки <span style={{ color: '#d8351e' }}>*</span>
                    </label>
                    <Select
                      value={level}
                      onValueChange={val => {
                        setLevel(val as RequestedLevel)
                        if (errors.requested_level) setErrors(p => ({ ...p, requested_level: undefined }))
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="kyb-level"
                        className="w-full h-9"
                        aria-invalid={!!errors.requested_level}
                        style={inputStyle(!!errors.requested_level)}
                      >
                        <SelectValue placeholder="Выберите уровень…" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex flex-col gap-0.5 py-0.5">
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-xs text-muted-foreground">{opt.ceiling}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.requested_level && <FieldError message={errors.requested_level} />}
                  </div>

                  {/* Time informer */}
                  <div
                    className="flex items-start gap-3 rounded-xl border px-4 py-3.5"
                    style={{ borderColor: '#635bff33', backgroundColor: '#e8e9ff55' }}
                  >
                    <Clock className="mt-0.5 size-4 shrink-0" style={{ color: '#533afd' }} />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold" style={{ color: '#3a28c0' }}>
                        Время проверки
                      </p>
                      <ul className="space-y-0.5">
                        {LEVEL_OPTIONS.map(opt => (
                          <li key={opt.value} className="flex items-baseline gap-1.5 text-xs text-[#3c4f69]">
                            <span className="font-semibold shrink-0">{opt.short}</span>
                            <span className="text-muted-foreground">—</span>
                            <span>{opt.time}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Server error */}
                  {serverError && (
                    <div
                      role="alert"
                      className="flex gap-3 rounded-xl border px-4 py-3.5"
                      style={{ borderColor: '#d8351e33', backgroundColor: '#d8351e0d' }}
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: '#d8351e' }} />
                      <p className="text-sm" style={{ color: '#d8351e' }}>{serverError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Отправляем документы…
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        Отправить на верификацию
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground leading-relaxed">
                    Отправляя форму, вы подтверждаете достоверность данных и принимаете{' '}
                    <a href="/legal/terms" className="text-primary hover:underline">условия верификации</a>.
                    Данные защищены согласно{' '}
                    <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Footer note */}
          {!success && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Уже на шаге 1?{' '}
              <Link href="/claim" className="text-primary hover:underline">
                Вернуться к поиску профиля
              </Link>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
