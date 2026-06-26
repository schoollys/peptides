import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — PeptideTrust',
  description: 'GDPR-совместимая политика обработки данных реестра PeptideTrust.',
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

export default function PrivacyPage() {
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
                Политика конфиденциальности
              </h1>
              <p className="text-xs tabular-nums" style={{ color: '#95a4ba' }}>
                Черновик v0.1 · последнее обновление: 2026-06-22
              </p>
            </div>

            {/* TODO: на ревью юриста */}
            <Section title="1. Контролёр и процессор">
              <p>
                В контексте GDPR (Регламент ЕС 2016/679) оператор Платформы выступает
                <strong style={{ color: '#1a2c44' }}> контролёром данных</strong> (data controller)
                в отношении данных, собираемых через форму регистрации, /submit и /claim.
              </p>
              <p>
                Обработка данных осуществляется на серверной инфраструктуре, расположенной в ЕС/ЕЭЗ.
                Передача данных за пределы ЕЭЗ производится исключительно при наличии стандартных
                договорных условий (SCC) или иного правового основания, предусмотренного GDPR.
              </p>
            </Section>

            <Section title="2. Минимизация и категории данных">
              <p>
                Платформа собирает только те данные, которые необходимы для выполнения конкретной
                функции (<strong style={{ color: '#1a2c44' }}>принцип минимизации, ст. 5(1)(c) GDPR</strong>):
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong style={{ color: '#1a2c44' }}>Данные юридических лиц</strong> — наименование,
                  юрисдикция, домен, публично доступные регуляторные данные; обрабатываются
                  на основании законного интереса оператора реестра.</li>
                <li><strong style={{ color: '#1a2c44' }}>KYB/KYC-документы</strong> — загружаются
                  участником добровольно для верификации; хранятся в зашифрованном виде;
                  доступны только верифицирующей стороне и не передаются третьим лицам.</li>
                <li><strong style={{ color: '#1a2c44' }}>Контактные данные пользователя</strong> — email
                  и идентификатор сессии; обрабатываются на основании договорной необходимости.</li>
              </ul>
            </Section>

            <Section title="3. On-chain данные: только хеши без ПДн">
              <p>
                В публичный anchor-лог (on-chain) публикуются исключительно{' '}
                <strong style={{ color: '#1a2c44' }}>хеши состояния данных</strong> (SHA-256 или аналог).
                Хеш не содержит персональных данных, не позволяет восстановить исходные документы
                и не является персональными данными по смыслу ст. 4(1) GDPR.
              </p>
              <p>
                Любые персональные или коммерчески чувствительные данные хранятся исключительно
                в закрытой off-chain базе данных и не публикуются в общем доступе.
              </p>
            </Section>

            <Section title="4. Права субъектов данных">
              <p>
                В соответствии с GDPR субъект данных (физическое лицо, чьи данные обрабатываются)
                вправе:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>запросить доступ к своим данным (ст. 15);</li>
                <li>потребовать исправления неточных данных (ст. 16);</li>
                <li>потребовать удаления данных из off-chain хранилища (ст. 17) — с учётом ограничений,
                  связанных с выполнением юридических обязательств;</li>
                <li>возразить против обработки на основании законного интереса (ст. 21);</li>
                <li>запросить переносимость данных (ст. 20).</li>
              </ul>
              <p>
                Запросы направляются на:{' '}
                <a href="mailto:privacy@peptidetrust.io" className="underline hover:no-underline" style={{ color: '#533afd' }}>
                  privacy@peptidetrust.io
                </a>.
                Срок ответа — 30 дней с момента получения запроса.
              </p>
            </Section>

            <Section title="5. Сроки хранения">
              <p>
                KYB/KYC-документы хранятся в течение срока действия участия в реестре плюс
                [X] лет после прекращения (заглушка — подлежит уточнению у юриста).
                Данные обращений (/report, /appeals) хранятся [Y] лет для целей аудита.
              </p>
            </Section>

            <Section title="6. Файлы cookie и трекинг">
              <p>
                Платформа использует только технически необходимые cookie для управления сессией.
                Маркетинговые или аналитические cookie не устанавливаются без явного согласия
                пользователя.
              </p>
            </Section>

            <Section title="7. Обращения и жалобы">
              <p>
                Субъект данных вправе подать жалобу в надзорный орган по защите данных
                по месту нахождения оператора или своего постоянного места жительства.
                Для EU: перечень органов доступен на сайте Европейского совета по защите данных
                (edpb.europa.eu).
              </p>
            </Section>

            <div className="flex flex-wrap gap-4 border-t border-border pt-5 text-xs">
              {[
                { label: 'Условия использования', href: '/legal/terms' },
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
