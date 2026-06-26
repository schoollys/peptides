import { CheckCircle2, Clock, ExternalLink, FileText, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ClaimResponse } from '@/lib/claim-data'

interface StepProvisionalProps {
  response: ClaimResponse
}

export function StepProvisional({ response }: StepProvisionalProps) {
  const estimatedDate = response.estimated_provisional_at
    ? new Date(response.estimated_provisional_at).toLocaleDateString('ru-RU', {
        day:   'numeric',
        month: 'long',
        year:  'numeric',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border px-5 py-5 space-y-3"
        style={{ borderColor: '#00b26133', backgroundColor: '#00b2610d' }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: '#00b261' }} />
          <div className="space-y-1">
            <p className="text-sm font-semibold" style={{ color: '#00b261' }}>
              Заявка принята
            </p>
            <p className="text-sm text-[#3c4f69] leading-relaxed">
              Статус:{' '}
              <span className="font-semibold">на проверке</span>
              {' → '}
              <span className="font-semibold">в реестре</span> после подтверждения
            </p>
          </div>
        </div>

        {/* Claim meta */}
        <div className="mt-1 grid grid-cols-1 gap-1.5 border-t pt-3" style={{ borderColor: '#00b26122' }}>
          <MetaRow label="Номер заявки"     value={response.claim_id}        mono />
          <MetaRow label="Контакт"          value={response.contact} />
          <MetaRow label="Уровень проверки" value={response.requested_level} />
          <MetaRow label="Отправлено"       value={new Date(response.submitted_at).toLocaleString('ru-RU')} />
          {estimatedDate && (
            <MetaRow label="Появится в реестре" value={estimatedDate} />
          )}
        </div>
      </div>

      {/* Steps ahead */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#061b31]">Что дальше</h3>
        <ol className="space-y-3">
          <TimelineItem
            icon={<Clock className="size-4" style={{ color: '#533afd' }} />}
            title="Ручная верификация (1–2 рабочих дня)"
            description={`Команда PeptideTrust проверит заявление и свяжется с вами по адресу ${response.contact}.`}
          />
          <TimelineItem
            icon={<Shield className="size-4" style={{ color: '#533afd' }} />}
            title="Профиль появляется в реестре"
            description="Профиль появится в каталоге с пометкой «данные собираются». Оценка будет уточняться по мере поступления данных."
          />
          <TimelineItem
            icon={<FileText className="size-4" style={{ color: '#533afd' }} />}
            title="Полная активация"
            description="После завершения проверки профиль станет активным. Чем глубже проверка, тем выше доступная оценка."
          />
        </ol>
      </div>

      {/* Explainer note */}
      <div
        className="rounded-xl border px-4 py-3.5 space-y-1.5"
        style={{ borderColor: '#635bff33', backgroundColor: '#e8e9ff55' }}
      >
        <p className="text-xs font-semibold" style={{ color: '#533afd' }}>
          Почему оценка пока ограничена
        </p>
        <p className="text-xs text-[#3c4f69] leading-relaxed">
          До полной проверки действует лимит оценки: базовая проверка — до 65,
          по документам — до 80, полная проверка — до 100. Это защищает покупателей
          от незаслуженно высоких оценок.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/p/${response.participant_id}`} className="flex-1">
          <Button
            variant="default"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Перейти к профилю
          </Button>
        </Link>
        <Link href="/catalog" className="flex-1">
          <Button variant="outline" className="w-full">
            Вернуться в каталог
          </Button>
        </Link>
      </div>

      {/* Request ID for support */}
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5">
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Код обращения в поддержку:&nbsp;
          <code className="font-mono text-[11px] text-[#3c4f69]">{response.request_id}</code>
        </p>
      </div>
    </div>
  )
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span
        className={`text-xs text-right truncate max-w-[60%] ${mono ? 'font-mono text-[#3c4f69]' : 'font-medium text-[#273951]'}`}
      >
        {value}
      </span>
    </div>
  )
}

function TimelineItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <li className="flex gap-3">
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: '#e8e9ff' }}
      >
        {icon}
      </div>
      <div className="space-y-0.5 pt-0.5">
        <p className="text-sm font-semibold text-[#061b31]">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </li>
  )
}
