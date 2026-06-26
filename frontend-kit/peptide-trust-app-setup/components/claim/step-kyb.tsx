'use client'

import { useState } from 'react'
import { AlertCircle, Loader2, Info } from 'lucide-react'
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
  mockSubmitClaim,
  validateClaimRequest,
  type RequestedLevel,
  type ClaimResponse,
  type FieldError,
  type SearchResult,
} from '@/lib/claim-data'

interface StepKybProps {
  selectedProfile: SearchResult
  onSuccess: (response: ClaimResponse) => void
  onBack: () => void
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

export function StepKyb({ selectedProfile, onSuccess, onBack }: StepKybProps) {
  const [contact, setContact]       = useState('')
  const [level, setLevel]           = useState<RequestedLevel | ''>('')
  const [errors, setErrors]         = useState<FieldError>({})
  const [loading, setLoading]       = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateClaimRequest(contact, level)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setServerError(null)

    try {
      const response = await mockSubmitClaim({
        participant_id: selectedProfile.id !== 'p-new' ? selectedProfile.id : undefined,
        contact,
        requested_level: level as RequestedLevel,
      })

      if (response.status === 'rejected') {
        setServerError(
          response.rejection_reason ??
          'Заявление отклонено. Обратитесь в службу поддержки, указав request_id: ' + response.request_id,
        )
      } else {
        onSuccess(response)
      }
    } catch {
      setServerError('Ошибка сети. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[#061b31]">Проверка компании</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Укажите контактный e-mail и запрашиваемый уровень доверия.
          Команда PeptideTrust выйдет на связь в течение 1–2 рабочих дней.
        </p>
      </div>

      {/* Selected profile summary */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Выбранный профиль</p>
          <p className="truncate text-sm font-semibold text-[#061b31]">{selectedProfile.display_name}</p>
          {selectedProfile.id !== 'p-new' && (
            <p className="text-xs text-muted-foreground font-mono">{selectedProfile.id}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-xs text-primary hover:underline"
        >
          Изменить
        </button>
      </div>

      {/* Contact field */}
      <div className="space-y-1.5">
        <label htmlFor="claim-contact" className="text-sm font-medium text-[#061b31]">
          Контакт <span style={{ color: '#d8351e' }}>*</span>
        </label>
        <Input
          id="claim-contact"
          type="email"
          placeholder="compliance@company.io"
          value={contact}
          onChange={e => {
            setContact(e.target.value)
            if (errors.contact) setErrors(prev => ({ ...prev, contact: undefined }))
          }}
          aria-invalid={!!errors.contact}
          aria-describedby={errors.contact ? 'contact-error' : 'contact-hint'}
          disabled={loading}
          className="h-9 text-sm"
        />
        {errors.contact ? (
          <div id="contact-error">
            <FieldErrorMsg message={errors.contact} />
          </div>
        ) : (
          <p id="contact-hint" className="text-xs text-muted-foreground">
            E-mail compliance-офицера или корпоративного домена
          </p>
        )}
      </div>

      {/* Level select */}
      <div className="space-y-1.5">
        <label htmlFor="claim-level" className="text-sm font-medium text-[#061b31]">
          Запрашиваемый уровень <span style={{ color: '#d8351e' }}>*</span>
        </label>
        <Select
          value={level}
          onValueChange={val => {
            setLevel(val as RequestedLevel)
            if (errors.requested_level) setErrors(prev => ({ ...prev, requested_level: undefined }))
          }}
          disabled={loading}
        >
          <SelectTrigger
            id="claim-level"
            className="w-full h-9"
            aria-invalid={!!errors.requested_level}
          >
            <SelectValue placeholder="Выберите уровень проверки…" />
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
        {errors.requested_level && (
          <FieldErrorMsg message={errors.requested_level} />
        )}
      </div>

      {/* Level explanation */}
      {level && (
        <LevelExplanation level={level as RequestedLevel} />
      )}

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border px-4 py-3.5"
          style={{
            borderColor: '#d8351e33',
            backgroundColor: '#d8351e0d',
          }}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: '#d8351e' }} />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold" style={{ color: '#d8351e' }}>Заявка отклонена</p>
            <p className="text-xs leading-relaxed" style={{ color: '#d8351e' }}>{serverError}</p>
          </div>
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
            Отправляем заявку…
          </>
        ) : (
          'Отправить заявку'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground leading-relaxed">
        Нажимая кнопку, вы подтверждаете достоверность предоставленных данных
        и соглашаетесь с{' '}
        <a href="/legal/terms" className="text-primary hover:underline">Условиями верификации PeptideTrust</a>.
      </p>

      {/* Пояснение про лимит оценки */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        Базовую проверку можно пройти сразу, без документов. До полной проверки оценка ограничена — чем глубже проверка, тем выше доступный уровень.
      </p>
    </form>
  )
}

function LevelExplanation({ level }: { level: RequestedLevel }) {
  const info: Record<RequestedLevel, { ceiling: string; pop: string; note: string }> = {
    L1: {
      ceiling: 'Оценка до 65 (уровень Silver)',
      pop:     'Достаточно заявления компании — без загрузки документов',
      note:    'Подходит для быстрого старта. Документы можно добавить позже.',
    },
    L2: {
      ceiling: 'Оценка до 80 (уровень Gold)',
      pop:     'Нужны документы компании: выписка из реестра и данные владельца (бенефициара)',
      note:    'Самый частый выбор — хороший баланс доверия и усилий.',
    },
    L3: {
      ceiling: 'Оценка до 100 (уровень Platinum)',
      pop:     'Глубокая проверка с подтверждением владельцев и выездом',
      note:    'Максимальное доверие. Нужны заверенные документы.',
    },
  }
  const { ceiling, pop, note } = info[level]
  return (
    <div
      className="rounded-xl border px-4 py-3.5 space-y-2"
      style={{ borderColor: '#635bff33', backgroundColor: '#e8e9ff66' }}
    >
      <div className="flex items-center gap-2">
        <Info className="size-4 shrink-0" style={{ color: '#533afd' }} />
        <span className="text-xs font-semibold" style={{ color: '#533afd' }}>{ceiling}</span>
      </div>
      <p className="text-xs text-[#3c4f69] leading-relaxed">{pop}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
    </div>
  )
}
