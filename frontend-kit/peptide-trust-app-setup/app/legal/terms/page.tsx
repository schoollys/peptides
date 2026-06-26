import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Условия использования — PeptideTrust',
  description: 'Условия использования информационного реестра PeptideTrust.',
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

export default function TermsPage() {
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
                Условия использования
              </h1>
              <p className="text-xs tabular-nums" style={{ color: '#95a4ba' }}>
                Черновик v0.1 · последнее обновление: 2026-06-22
              </p>
            </div>

            {/* TODO: на ревью юриста */}
            <Section title="1. Статус платформы">
              <p>
                PeptideTrust («Платформа») является <strong style={{ color: '#1a2c44' }}>нейтральным информационным реестром</strong>.
                Платформа не является маркетплейсом, брокером, посредником в сделках,
                медицинским советником или юридическим консультантом.
              </p>
              <p>
                Все продукты, описанные в реестре, предназначены исключительно для целей
                <strong style={{ color: '#1a2c44' }}> research-use-only (RUO)</strong> — использования
                в исследовательских лабораториях квалифицированным персоналом. Использование
                в клинических, ветеринарных или потребительских целях без соответствующего
                регуляторного разрешения не поддерживается Платформой.
              </p>
            </Section>

            <Section title="2. Информационный характер Trust Score">
              <p>
                Trust Score и все производные от него оценки, тиры и флаги являются
                <strong style={{ color: '#1a2c44' }}> информационными показателями</strong>, основанными
                на данных, предоставленных участниками, и независимых тестах. Они не являются:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>аудиторским заключением или сертификатом качества;</li>
                <li>юридической оценкой соответствия требованиям регулятора;</li>
                <li>офертой или рекомендацией к совершению сделок;</li>
                <li>медицинским заключением или рекомендацией по применению.</li>
              </ul>
              <p>
                Любые коммерческие или иные решения, принятые на основе данных Платформы,
                принимаются пользователем самостоятельно и на его риск.
              </p>
            </Section>

            <Section title="3. Порядок оспаривания оценки">
              <p>
                Участник реестра, считающий, что его Trust Score или флаг содержит
                фактическую ошибку, вправе подать апелляцию через форму{' '}
                <Link href="/appeals/new" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  /appeals/new
                </Link>.
                Апелляция рассматривается независимой арбитражной панелью в соответствии
                с процедурой, описанной в Методологии. Решение панели является обязательным
                в рамках реестра. Правовой путь вне реестра сохранён.
              </p>
            </Section>

            <Section title="4. Ограничение ответственности">
              <p>
                Платформа не несёт ответственности за прямой или косвенный ущерб,
                возникший в результате использования данных реестра, включая неточности
                в данных, задержки обновления Score, изменения методологии или недоступность сервиса.
              </p>
            </Section>

            <Section title="5. Интеллектуальная собственность">
              <p>
                Методология расчёта Trust Score, алгоритм и программный код Платформы защищены
                авторским правом. Данные участников остаются их собственностью; публикация в реестре
                осуществляется на основании лицензии, описанной в{' '}
                <Link href="/legal/privacy" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  Политике конфиденциальности
                </Link>.
              </p>
            </Section>

            <Section title="6. Применимое право">
              <p>
                Настоящие условия регулируются правом юрисдикции оператора. Подробнее —
                в разделе{' '}
                <Link href="/legal/jurisdiction" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  Оператор и юрисдикция
                </Link>.
              </p>
            </Section>

            <Section title="7. Контакт">
              <p>
                По правовым вопросам:{' '}
                <a href="mailto:legal@peptidetrust.io" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  legal@peptidetrust.io
                </a>
              </p>
            </Section>

            {/* Cross-links */}
            <div className="flex flex-wrap gap-4 border-t border-border pt-5 text-xs">
              {[
                { label: 'Политика конфиденциальности', href: '/legal/privacy' },
                { label: 'Отказ от ответственности', href: '/legal/disclaimer' },
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
