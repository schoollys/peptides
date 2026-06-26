'use client'

import { useState, useRef, useCallback } from 'react'
import {
  AlertCircle, AlertTriangle, Info, Loader2,
  Upload, X, FileText, ShieldCheck,
} from 'lucide-react'
import { Input }   from '@/components/ui/input'
import { Button }  from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  FACTOR_META, KIND_META,
  validateSubmission, mockSubmitData, getCustodyHint,
  type SubmissionKind, type FactorCode,
  type SubmissionRequest, type SubmissionResponse,
  type SubmissionError422, type FieldErrors,
} from '@/lib/submit-data'

const FACTOR_CODES = Object.keys(FACTOR_META) as FactorCode[]
const KIND_CODES   = Object.keys(KIND_META)   as SubmissionKind[]

interface SubmitFormProps {
  onSuccess: (res: SubmissionResponse) => void
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium mt-1.5" style={{ color: '#d8351e' }}>
      <AlertCircle className="size-3 shrink-0" />
      {msg}
    </p>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
      style={{ borderColor: '#c9a22733', backgroundColor: '#c9a2270d' }}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" style={{ color: '#c9a227' }} />
      <p className="text-xs leading-relaxed" style={{ color: '#7d5c00' }}>{children}</p>
    </div>
  )
}

function ErrorBanner({ error }: { error: SubmissionError422 }) {
  return (
    <div
      role="alert"
      className="rounded-xl border px-4 py-3.5 space-y-1"
      style={{ borderColor: '#d8351e33', backgroundColor: '#d8351e0d' }}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0" style={{ color: '#d8351e' }} />
        <p className="text-sm font-semibold" style={{ color: '#d8351e' }}>
          422 — Ошибка валидации бизнес-правил
        </p>
      </div>
      <p className="text-sm ml-6" style={{ color: '#d8351e' }}>{error.message}</p>
      {error.hint && (
        <p className="text-xs ml-6 text-[#7d3a2a]">{error.hint}</p>
      )}
      <p className="text-xs ml-6 font-mono text-muted-foreground">code: {error.code}</p>
    </div>
  )
}

// ---- Drop Zone ----
interface DropZoneProps {
  file:        File | null
  onFile:      (f: File | null) => void
  error?:      string
  disabled?:   boolean
}

function DropZone({ file, onFile, error, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [disabled, onFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }, [disabled])

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#061b31]">
        Подписанный COA / артефакт
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(опционально)</span>
      </label>

      {file ? (
        <div
          className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
        >
          <FileText className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#061b31]">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onFile(null)}
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Удалить файл"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          aria-invalid={!!error}
          className={[
            'w-full rounded-2xl border-2 border-dashed px-6 py-8 transition-colors text-center',
            'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            'disabled:pointer-events-none disabled:opacity-50',
            dragOver
              ? 'border-primary bg-accent/50'
              : error
                ? 'border-destructive/60 bg-destructive/5'
                : 'border-border bg-transparent hover:border-input hover:bg-secondary/40',
          ].join(' ')}
        >
          <Upload
            className="mx-auto mb-3 size-7"
            style={{ color: dragOver ? '#533afd' : '#95a4ba' }}
          />
          <p className="text-sm font-medium text-[#3c4f69]">
            Перетащите файл или{' '}
            <span className="text-primary">выберите</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, PNG, JPG, JSON — до 20 MB
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.png,.jpg,.jpeg,.json"
        disabled={disabled}
        onChange={e => {
          const f = e.target.files?.[0] ?? null
          onFile(f)
          e.target.value = ''
        }}
      />
      {error && <FieldError msg={error} />}
    </div>
  )
}

// ---- Main form ----
export function SubmitForm({ onSuccess }: SubmitFormProps) {
  const [participantId, setParticipantId] = useState('')
  const [kind,          setKind]          = useState<SubmissionKind | ''>('')
  const [lotQrKey,      setLotQrKey]      = useState('')
  const [factor,        setFactor]        = useState<FactorCode | ''>('')
  const [value,         setValue]         = useState('')
  const [file,          setFile]          = useState<File | null>(null)

  const [errors,       setErrors]       = useState<FieldErrors>({})
  const [serverError,  setServerError]  = useState<SubmissionError422 | null>(null)
  const [loading,      setLoading]      = useState(false)

  // Inline custody hint — show for review (no file = incomplete custody) and coa/test without file
  const custodyHint = kind
    ? kind === 'review' && !file
      ? 'Неполная цепочка хранения — Vᵢ будет < 1.0. Для review без подписанного файла множитель верификации снижается.'
      : getCustodyHint(kind as SubmissionKind, !!file)
    : null

  // Lot-QR duplicate warning (checked realtime against known dupes for demo)
  const lotDupeWarning =
    lotQrKey && ['LOT-2024-DUPE', 'DUP-001'].includes(lotQrKey.toUpperCase())
      ? 'Этот Lot-QR ключ уже встречался в системе — повторное использование артефакта приведёт к ошибке.'
      : null

  function clearFieldError(field: keyof FieldErrors) {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    const numValue = parseFloat(value)
    const req: Partial<SubmissionRequest> = {
      participant_id: participantId,
      kind:           kind || undefined,
      factor:         factor || undefined,
      value:          isNaN(numValue) ? undefined : numValue,
      lot_qr_key:     lotQrKey || undefined,
    }

    const fieldErrors = validateSubmission(req, !!file)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      const result = await mockSubmitData({
        participant_id: participantId,
        kind:           kind as SubmissionKind,
        factor:         factor as FactorCode,
        value:          numValue,
        lot_qr_key:     lotQrKey || undefined,
        media_ref:      file ? `media://${file.name}` : undefined,
        signed_payload: `x-sig-mock-${Date.now()}`,
      })

      if (result.ok) {
        onSuccess(result.data)
      } else {
        setServerError(result.error)
        // Highlight the offending field
        if (result.error.field) {
          setErrors(prev => ({
            ...prev,
            [result.error.field!]: result.error.message,
          }))
        }
      }
    } catch {
      setServerError({
        code:    'NETWORK_ERROR',
        message: 'Ошибка сети. Проверьте подключение и попробуйте снова.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* --- Participant ID --- */}
      <div className="space-y-1.5">
        <label htmlFor="sub-pid" className="text-sm font-medium text-[#061b31]">
          ID участника или домен <span style={{ color: '#d8351e' }}>*</span>
        </label>
        <Input
          id="sub-pid"
          placeholder="p-001 или company.io"
          value={participantId}
          onChange={e => { setParticipantId(e.target.value); clearFieldError('participant_id') }}
          aria-invalid={!!errors.participant_id}
          disabled={loading}
          className="h-9"
        />
        {errors.participant_id
          ? <FieldError msg={errors.participant_id} />
          : <p className="text-xs text-muted-foreground mt-1">
              Введите <code className="font-mono text-[11px] bg-secondary px-1 rounded">p-XXX</code> или доменное имя
            </p>
        }
      </div>

      {/* --- Kind + Factor (side by side on md+) --- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Kind */}
        <div className="space-y-1.5">
          <label htmlFor="sub-kind" className="text-sm font-medium text-[#061b31]">
            Тип данных <span style={{ color: '#d8351e' }}>*</span>
          </label>
          <Select
            value={kind}
            onValueChange={v => { setKind(v as SubmissionKind); clearFieldError('kind') }}
            disabled={loading}
          >
            <SelectTrigger
              id="sub-kind"
              className="w-full h-9"
              aria-invalid={!!errors.kind}
            >
              <SelectValue placeholder="Выберите тип…" />
            </SelectTrigger>
            <SelectContent>
              {KIND_CODES.map(k => (
                <SelectItem key={k} value={k}>
                  <div className="flex flex-col gap-px py-0.5">
                    <span className="font-medium text-sm">{KIND_META[k].label}</span>
                    <span className="text-xs text-muted-foreground">{KIND_META[k].description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.kind && <FieldError msg={errors.kind} />}
        </div>

        {/* Factor */}
        <div className="space-y-1.5">
          <label htmlFor="sub-factor" className="text-sm font-medium text-[#061b31]">
            Фактор <span style={{ color: '#d8351e' }}>*</span>
          </label>
          <Select
            value={factor}
            onValueChange={v => { setFactor(v as FactorCode); clearFieldError('factor') }}
            disabled={loading}
          >
            <SelectTrigger
              id="sub-factor"
              className="w-full h-9"
              aria-invalid={!!errors.factor}
            >
              <SelectValue placeholder="Фактор…" />
            </SelectTrigger>
            <SelectContent>
              {FACTOR_CODES.map(fc => (
                <SelectItem key={fc} value={fc}>
                  <div className="flex flex-col gap-px py-0.5">
                    <span className="font-medium text-sm">{FACTOR_META[fc].label}</span>
                    <span className="text-xs text-muted-foreground">{FACTOR_META[fc].description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.factor && <FieldError msg={errors.factor} />}
        </div>
      </div>

      {/* Custody hint — shown when kind needs a file but none attached */}
      {custodyHint && <InfoBanner>{custodyHint}</InfoBanner>}

      {/* --- Value --- */}
      <div className="space-y-1.5">
        <label htmlFor="sub-value" className="text-sm font-medium text-[#061b31]">
          Значение (0–100) <span style={{ color: '#d8351e' }}>*</span>
        </label>
        <div className="relative">
          <Input
            id="sub-value"
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="0 – 100"
            value={value}
            onChange={e => { setValue(e.target.value); clearFieldError('value') }}
            aria-invalid={!!errors.value}
            disabled={loading}
            className="h-9 pr-16 tabular-nums"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            / 100
          </span>
        </div>
        {errors.value
          ? <FieldError msg={errors.value} />
          : value !== '' && !isNaN(parseFloat(value)) && (
              <ValueBar v={Math.min(100, Math.max(0, parseFloat(value)))} />
            )
        }
      </div>

      {/* --- Lot-QR key --- */}
      <div className="space-y-1.5">
        <label htmlFor="sub-lot" className="text-sm font-medium text-[#061b31]">
          Lot-QR ключ
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(опционально)</span>
        </label>
        <Input
          id="sub-lot"
          placeholder="LOT-2024-XXXX"
          value={lotQrKey}
          onChange={e => { setLotQrKey(e.target.value); clearFieldError('lot_qr_key') }}
          aria-invalid={!!errors.lot_qr_key}
          disabled={loading}
          className="h-9 font-mono text-sm"
        />
        {errors.lot_qr_key
          ? <FieldError msg={errors.lot_qr_key} />
          : lotDupeWarning
            ? (
                <div
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 mt-1"
                  style={{ borderColor: '#d8351e33', backgroundColor: '#d8351e0d' }}
                >
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" style={{ color: '#d8351e' }} />
                  <p className="text-xs leading-relaxed" style={{ color: '#d8351e' }}>
                    {lotDupeWarning}
                  </p>
                </div>
              )
            : (
                <p className="text-xs text-muted-foreground mt-1">
                  QR-идентификатор лота из системы GS1 или внутренней маркировки
                </p>
              )
        }
      </div>

      {/* --- Drop zone --- */}
      <DropZone
        file={file}
        onFile={setFile}
        error={errors.file}
        disabled={loading}
      />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* X-Signature note */}
      <div
        className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
        style={{ borderColor: '#635bff33', backgroundColor: '#e8e9ff66' }}
      >
        <ShieldCheck className="mt-0.5 size-4 shrink-0" style={{ color: '#533afd' }} />
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#533afd' }}>
            X-Signature
          </p>
          <p className="text-xs text-[#3c4f69] leading-relaxed">
            Запись будет подписана вашим ключом участника (Ed25519) перед отправкой.
            В демо используется mock-подпись.
          </p>
        </div>
      </div>

      {/* Server / 422 error */}
      {serverError && <ErrorBanner error={serverError} />}

      {/* Submit CTA */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 font-semibold text-sm"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Подписываем и отправляем…
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" />
            Подписать и отправить (X-Signature)
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground leading-relaxed">
        Отправляя данные, вы подтверждаете их достоверность.{' '}
        <a href="/legal/terms" className="text-primary hover:underline">Правила подачи данных</a>
      </p>
    </form>
  )
}

// Mini progress bar for value field
function ValueBar({ v }: { v: number }) {
  const color = v >= 75 ? '#00b261' : v >= 40 ? '#533afd' : '#d8351e'
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${v}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Введено: <span className="font-semibold tabular-nums" style={{ color }}>{v.toFixed(1)}</span> / 100
      </p>
    </div>
  )
}
