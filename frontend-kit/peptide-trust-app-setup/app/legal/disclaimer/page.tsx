import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Отказ от ответственности — PeptideTrust',
  description: 'Информационный характер Trust Score и RUO-ограничения. Отказ от ответственности.',
}

/* TODO: на ревью юриста */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold" style={{ color: '#1a2c44' }}>{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: '#50617a' }}>
        {children}
      </div>
    </section>
  )
}

export default function DisclaimerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">

          {/* Draft banner */}
          {/* TODO: на ревью юриста */}
          <div
            className="mb-6 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: 'rgba(201,162,39,.10)', border: '1px solid rgba(201,162,39,.30)', color: '#8a6800' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Черновик — на юридическом ревью
          </div>

          <div
            className="rounded-2xl border border-border bg-card px-7 py-8 sm:px-10 sm:py-10 space-y-7"
            style={{ boxShadow: '0 2px 10px 0 rgba(0,55,112,.06)' }}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7d8ba4' }}>
                Правовые документы
              </p>
              <h1 className="text-xl font-semibold" style={{ color: '#061b31' }}>
                Отказ от ответственности
              </h1>
              <p className="text-xs tabular-nums" style={{ color: '#95a4ba' }}>
                Черновик v0.1 · последнее обновление: 2026-06-22
              </p>
            </div>

            {/* TODO: на ревью юриста */}
            <Section title="1. Research-Use-Only (RUO)">
              <p>
                Все вещества, продукты и услуги, представленные в реестре PeptideTrust,
                описаны исключительно для целей{' '}
                <strong style={{ color: '#1a2c44' }}>research-use-only (RUO)</strong> — применения
                в научных лабораториях квалифицированным персоналом в контролируемых условиях.
              </p>
              <p>
                Ни PeptideTrust, ни участники реестра не предназначают описанные продукты для
                диагностики, лечения, профилактики или терапии каких-либо заболеваний у людей или
                животных. Использование продуктов RUO в клинических или потребительских целях
                без соответствующего регуляторного разрешения запрещено.
              </p>
            </Section>

            <Section title="2. Информационный характер Trust Score">
              <p>
                Trust Score является{' '}
                <strong style={{ color: '#1a2c44' }}>информационным показателем</strong>, основанным
                на публично доступных данных и добровольно предоставленных документах участников.
                Score не является:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>обвинением, диффамацией или юридическим заключением в отношении участника;</li>
                <li>сертификатом соответствия, аудиторским заключением или разрешением регулятора;</li>
                <li>гарантией качества продукта или безопасности сделки.</li>
              </ul>
              <p>
                Низкий Trust Score отражает недостаточность верифицированных данных в реестре
                или наличие задокументированных инцидентов — но не является юридически обязательным
                выводом о виновности или несоответствии.
              </p>
            </Section>

            <Section title="3. Ограничение ответственности">
              <p>
                В максимально допустимой применимым правом мере PeptideTrust не несёт
                ответственности за:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>прямой, косвенный или последующий ущерб от использования данных реестра;</li>
                <li>ошибки, неточности или устаревшие данные в профилях участников;</li>
                <li>коммерческие решения, принятые на основании Trust Score;</li>
                <li>недоступность сервиса, технические сбои или изменения методологии.</li>
              </ul>
            </Section>

            <Section title="4. Право на оспаривание">
              <p>
                Участник реестра вправе оспорить Trust Score или активный флаг через форму{' '}
                <Link href="/appeals/new" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  апелляции
                </Link>.
                Правовой путь вне реестра (в том числе обращение в суд) сохранён в полном объёме.
              </p>
            </Section>

            <div className="flex flex-wrap gap-4 border-t border-border pt-5 text-xs">
              {[
                { label: 'Условия использования', href: '/legal/terms' },
                { label: 'Политика конфиденциальности', href: '/legal/privacy' },
                { label: 'Оператор и юрисдикция', href: '/legal/jurisdiction' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="hover:underline" style={{ color: '#533afd' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
