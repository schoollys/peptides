'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppealStatusTracker } from './appeal-status-tracker'
import {
  mockSubmitAppeal,
  validateAppealRequest,
  getActiveFlags,
  getFlagLabel,
  type Appeal,
  type AppealFieldError,
} from '@/lib/appeals-data'
import type { Flag } from '@/lib/profile-data'
import { cn } from '@/lib/utils'

// ─── Severity colour map ────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, { dot: string; text: string }> = {
  INFO:     { dot: 'bg-[#533afd]',  text: 'text-[#533afd]' },
  WARNING:  { dot: 'bg-[#c9a227]',  text: 'text-[#c9a227]' },
  CRITICAL: { dot: 'bg-[#d8351e]',  text: 'text-[#d8351e]' },
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium mt-1.5" style={{ color: '#d8351e' }}>
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
  )
}

function FlagSelectItem({ flag }: { flag: Flag }) {
  const sty = SEVERITY_STYLE[flag.severity] ?? SEVERITY_STYLE.INFO
  return (
    <div className="flex items-start gap-2.5 py-0.5">
      <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', sty.dot)} />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-medium text-sm">{getFlagLabel(flag.type)}</span>
        <span className="text-xs text-muted-foreground leading-snug line-clamp-2">
          {flag.message}
        </span>
        <span className={cn('text-[10px] font-semibold uppercase tracking-wide', sty.text)}>
          {flag.severity}
        </span>
      </div>
    </div>
  )
}

// ─── Success state ──────────────────────────────────────────────────────────
function AppealSuccess({ appeal }: { appeal: Appeal }) {
  return (
    <div className="space-y-6">
      {/* 201 banner */}
      <div
        className="flex items-start gap-3 rounded-2xl border px-5 py-4"
        style={{ borderColor: '#00b261' + '33', backgroundColor: '#00b261' + '0d' }}
      >
        <CheckCircle2 className="size-5 shrink-0 mt-0.5" style={{ color: '#00b261' }} />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold" style={{ color: '#00b261' }}>
            Апелляция принята — 201 Created
          </p>
          <p className="text-xs leading-relaxed text-[#3c4f69]">
            Панель арбитражных рецензентов формируется. Вы получите уведомление при переходе
            статуса в&nbsp;<span className="font-mono font-medium">in_review</span>.
          </p>
        </div>
      </div>

      {/* Status tracker */}
      <AppealStatusTracker currentStatus={appeal.status} />

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {[
          { label: 'ID апелляции', value: appeal.id, mono: true },
          { label: 'Request ID',   value: appeal.request_id, mono: true },
          { label: 'Флаг',         value: getFlagLabel(appeal.flag_type), mono: false },
          { label: 'Статус',       value: 'submitted', mono: true },
        ].map(({ label, value, mono }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-background px-4 py-3 space-y-0.5"
          >
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={cn('text-sm font-semibold text-[#061b31] truncate', mono && 'font-mono')}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Procedure note */}
      <div
        className="rounded-2xl border px-5 py-4 space-y-3"
        style={{ borderColor: '#635bff33', backgroundColor: '#e8e9ff55' }}
      >
        <div className="flex items-center gap-2">
          <Info className="size-4 shrink-0" style={{ color: '#533afd' }} />
          <span className="text-xs font-semibold" style={{ color: '#533afd' }}>
            Порядок арбитража
          </span>
        </div>
        <ul className="space-y-1.5 text-xs text-[#3c4f69] leading-relaxed list-none">
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">1.</span>
            Панель формируется через VRF-лотерею + conflict-screen (исключаются заинтересованные стороны).
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">2.</span>
            Chair-оракул координирует рассмотрение; срок — до 14 рабочих дней.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">3.</span>
            Решение является обязательным (binding) и фиксируется в реестре ончейн.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">4.</span>
            Проигравшая сторона несёт арбитражный сбор (loser-pays).
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1 h-9 text-sm">
          <Link href="/catalog">Вернуться в каталог</Link>
        </Button>
        <Button asChild className="flex-1 h-9 bg-primary text-primary-foreground text-sm font-semibold">
          <Link href="/appeals/new">Подать новую</Link>
        </Button>
      </div>
    </div>
  )
}

// ─── Main form ──────────────────────────────────────────────────────────────
export function AppealForm() {
  const searchParams = useSearchParams()
  const paramSubject = searchParams.get('subject') ?? ''
  const paramFlag    = searchParams.get('flag') ?? ''

  const [subjectId, setSubjectId] = useState(paramSubject)
  const [flags, setFlags]         = useState<Flag[]>(() =>
    paramSubject ? getActiveFlags(paramSubject) : []
  )
  const [flagId, setFlagId]       = useState(paramFlag)
  const [statement, setStatement] = useState('')
  const [errors, setErrors]       = useState<AppealFieldError>({})
  const [loading, setLoading]     = useState(false)
  const [serverError, setServerError] = useState<{ message: string; hint: string } | null>(null)
  const [appeal, setAppeal]       = useState<Appeal | null>(null)

  // Re-sync if URL params change after mount (e.g. back/forward navigation)
  useEffect(() => {
    const s = searchParams.get('subject') ?? ''
    const f = searchParams.get('flag') ?? ''
    if (s && s !== subjectId) {
      setSubjectId(s)
      setFlags(getActiveFlags(s))
    }
    if (f && f !== flagId) setFlagId(f)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const charCount   = statement.length
  const charMax     = 4000
  const charWarning = charCount > charMax * 0.85

  // Load flags when subject_id is committed (blur or Enter)
  function handleSubjectIdBlur() {
    const trimmed = subjectId.trim()
    if (trimmed) {
      const loaded = getActiveFlags(trimmed)
      setFlags(loaded)
      setFlagId('')   // reset flag selection on new id
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const req = { subject_id: subjectId.trim(), flag_id: flagId, statement }
    const errs = validateAppealRequest(req)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setServerError(null)

    try {
      const res = await mockSubmitAppeal(req)
      if (res.http_status === 422 && res.error) {
        setServerError({ message: res.error.message, hint: res.error.hint })
      } else {
        setAppeal(res.appeal)
      }
    } catch {
      setServerError({ message: 'Ошибка сети. Попробуйте ещё раз.', hint: '' })
    } finally {
      setLoading(false)
    }
  }

  if (appeal) return <AppealSuccess appeal={appeal} />

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── Subject ID ── */}
      <div className="space-y-1.5">
        <label htmlFor="appeal-subject" className="text-sm font-medium text-[#061b31]">
          ID участника <span style={{ color: '#d8351e' }}>*</span>
        </label>
        <Input
          id="appeal-subject"
          placeholder="p-005, p-012 …"
          value={subjectId}
          onChange={e => {
            setSubjectId(e.target.value)
            if (errors.subject_id) setErrors(p => ({ ...p, subject_id: undefined }))
          }}
          onBlur={handleSubjectIdBlur}
          aria-invalid={!!errors.subject_id}
          aria-describedby={errors.subject_id ? 'subject-error' : 'subject-hint'}
          disabled={loading}
          className="h-9 font-mono text-sm"
        />
        {errors.subject_id ? (
          <div id="subject-error"><FieldError message={errors.subject_id} /></div>
        ) : (
          <p id="subject-hint" className="text-xs text-muted-foreground">
            Идентификатор профиля из каталога. После ввода флаги загружаются автоматически.
          </p>
        )}
      </div>

      {/* ── Flag select ── */}
      <div className="space-y-1.5">
        <label htmlFor="appeal-flag" className="text-sm font-medium text-[#061b31]">
          Оспариваемый флаг <span style={{ color: '#d8351e' }}>*</span>
        </label>
        <Select
          value={flagId}
          onValueChange={val => {
            setFlagId(val)
            if (errors.flag_id) setErrors(p => ({ ...p, flag_id: undefined }))
          }}
          disabled={loading || flags.length === 0}
        >
          <SelectTrigger
            id="appeal-flag"
            className="w-full h-auto min-h-9 py-2"
            aria-invalid={!!errors.flag_id}
          >
            <SelectValue
              placeholder={
                flags.length === 0
                  ? 'Введите ID участника выше, чтобы загрузить флаги'
                  : 'Выберите флаг для оспаривания…'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {flags.map(flag => (
              <SelectItem key={flag.id} value={flag.id}>
                <FlagSelectItem flag={flag} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.flag_id && <FieldError message={errors.flag_id} />}
        {flags.length === 0 && subjectId.trim() && !errors.subject_id && (
          <p className="text-xs text-muted-foreground">
            Активные флаги не найдены для этого участника.
          </p>
        )}
      </div>

      {/* ── Statement ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="appeal-statement" className="text-sm font-medium text-[#061b31]">
            Заявление / доказательства <span style={{ color: '#d8351e' }}>*</span>
          </label>
          <span
            className={cn(
              'text-[11px] tabular-nums',
              charWarning ? 'text-[#c9a227]' : 'text-muted-foreground',
            )}
          >
            {charCount} / {charMax}
          </span>
        </div>
        <textarea
          id="appeal-statement"
          rows={7}
          value={statement}
          onChange={e => {
            setStatement(e.target.value)
            if (errors.statement) setErrors(p => ({ ...p, statement: undefined }))
          }}
          aria-invalid={!!errors.statement}
          aria-describedby={errors.statement ? 'statement-error' : 'statement-hint'}
          disabled={loading}
          placeholder="Опишите основания оспаривания флага. Укажите конкретные факты, ссылки на документы, хэши транзакций или другие доказательства. Минимум 30 символов."
          className={cn(
            'w-full resize-y rounded-md border bg-background px-3 py-2.5',
            'text-sm leading-relaxed text-[#061b31] placeholder:text-muted-foreground',
            'transition-colors duration-150 outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            errors.statement
              ? 'border-[#d8351e] focus:border-[#d8351e] focus:ring-[#d8351e]/20'
              : 'border-border',
          )}
        />
        {errors.statement ? (
          <div id="statement-error"><FieldError message={errors.statement} /></div>
        ) : (
          <p id="statement-hint" className="text-xs text-muted-foreground">
            Можно прикрепить данные, загрузив их через{' '}
            <Link href="/submit" className="text-primary hover:underline">
              /submit
            </Link>{' '}
            и сославшись на submission_id здесь.
          </p>
        )}
      </div>

      {/* ── Loser-pays warning ── */}
      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border px-4 py-3.5"
        style={{ borderColor: '#c9a22733', backgroundColor: '#c9a2270d' }}
      >
        <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: '#c9a227' }} />
        <div className="space-y-1">
          <p className="text-xs font-semibold" style={{ color: '#c9a227' }}>
            Правило loser-pays
          </p>
          <p className="text-xs leading-relaxed text-[#3c4f69]">
            В случае отклонения апелляции арбитражный сбор (loser-pays) выставляется
            заявителю согласно тарифной сетке Реестра. Убедитесь, что у вас есть
            достаточно доказательств перед подачей.
          </p>
        </div>
      </div>

      {/* ── Server 422 error ── */}
      {serverError && (
        <div
          role="alert"
          className="rounded-2xl border px-5 py-4 space-y-1.5"
          style={{ borderColor: '#d8351e33', backgroundColor: '#d8351e0d' }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" style={{ color: '#d8351e' }} />
            <p className="text-sm font-semibold" style={{ color: '#d8351e' }}>
              Ошибка валидации бизнес-правил — 422
            </p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#d8351e' }}>
            {serverError.message}
          </p>
          {serverError.hint && (
            <p className="text-xs leading-relaxed text-[#3c4f69] border-t border-[#d8351e22] pt-2 mt-2">
              <span className="font-semibold">Рекомендация:</span> {serverError.hint}
            </p>
          )}
        </div>
      )}

      {/* Legal status + confidentiality note */}
      {/* TODO: на ревью юриста */}
      <p className="text-xs leading-relaxed" style={{ color: '#95a4ba' }}>
        Апелляция рассматривается независимой арбитражной панелью. Персональные данные заявителя
        остаются конфиденциальными и не раскрываются оппонирующей стороне без отдельного согласия.
        Обработка данных — в соответствии с{' '}
        <Link href="/legal/privacy" className="underline hover:no-underline" style={{ color: '#7d8ba4' }}>
          Политикой конфиденциальности
        </Link>
        . Правовой путь вне реестра сохранён.
      </p>

      {/* ── Submit ── */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Отправка апелляции…
          </>
        ) : (
          'Подать апелляцию'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground leading-relaxed">
        Подача апелляции означает согласие с{' '}
        <a href="#" className="text-primary hover:underline">
          Регламентом арбитражных процедур PeptideTrust
        </a>
        , включая правило loser-pays.
      </p>
    </form>
  )
}
