import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Оператор и юрисдикция — PeptideTrust',
  description: 'Юрисдикция оператора, применимое право и регуляторная база реестра PeptideTrust.',
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

export default function JurisdictionPage() {
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
                Оператор и юрисдикция
              </h1>
              <p className="text-xs tabular-nums" style={{ color: '#95a4ba' }}>
                Черновик v0.1 · последнее обновление: 2026-06-22
              </p>
            </div>

            {/* TODO: на ревью юриста */}
            <Section title="1. Оператор реестра">
              <p>
                Оператор платформы PeptideTrust зарегистрирован в{' '}
                <strong style={{ color: '#1a2c44' }}>EU/CH</strong> (точные реквизиты будут
                внесены после регистрации юридического лица — заглушка для ревью юриста).
              </p>
              <p>
                Наименование оператора: <span style={{ color: '#1a2c44' }}>[НАИМЕНОВАНИЕ ЮРИДИЧЕСКОГО ЛИЦА]</span><br />
                Регистрационный номер: <span style={{ color: '#1a2c44' }}>[РЕГИСТРАЦИОННЫЙ НОМЕР]</span><br />
                Адрес: <span style={{ color: '#1a2c44' }}>[АДРЕС ЗАРЕГИСТРИРОВАННОГО ОФИСА]</span><br />
                Email: <a href="mailto:legal@peptidetrust.io" className="underline hover:no-underline" style={{ color: '#533afd' }}>legal@peptidetrust.io</a>
              </p>
            </Section>

            <Section title="2. Реестровая деятельность">
              <p>
                Реестр ведётся в соответствии с:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Регламентом ЕС 2016/679 (GDPR) в части обработки персональных данных;</li>
                <li>применимым национальным законодательством юрисдикции оператора;</li>
                <li>внутренней Методологией расчёта Trust Score (публикуется на <Link href="/trust-model" className="underline hover:no-underline" style={{ color: '#533afd' }}>/trust-model</Link>).</li>
              </ul>
              <p>
                Реестр охватывает участников рынка пептидов в EU/CH-юрисдикциях (MVP-скоуп).
                Расширение на другие юрисдикции планируется в следующих фазах.
              </p>
            </Section>

            <Section title="3. Применимое право и разрешение споров">
              <p>
                Настоящие документы и отношения между оператором и пользователями
                регулируются правом <strong style={{ color: '#1a2c44' }}>[ЮРИСДИКЦИЯ — заглушка]</strong>.
              </p>
              <p>
                Споры, возникающие из использования Платформы, подлежат разрешению в судах
                по месту регистрации оператора, если иное не предусмотрено обязательными нормами
                применимого права. Внутренние споры об оценке (Trust Score) разрешаются через
                арбитражную процедуру реестра ({' '}
                <Link href="/appeals/new" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  апелляции
                </Link>{' '}).
              </p>
            </Section>

            <Section title="4. Контактное лицо по вопросам GDPR">
              <p>
                Уполномоченный по защите данных (DPO):{' '}
                <a href="mailto:dpo@peptidetrust.io" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  dpo@peptidetrust.io
                </a>{' '}
                (заглушка — назначается после регистрации оператора).
              </p>
            </Section>

            <div className="flex flex-wrap gap-4 border-t border-border pt-5 text-xs">
              {[
                { label: 'Условия использования', href: '/legal/terms' },
                { label: 'Политика конфиденциальности', href: '/legal/privacy' },
                { label: 'Отказ от ответственности', href: '/legal/disclaimer' },
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
