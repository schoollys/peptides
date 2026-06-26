import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Scale } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AppealForm } from '@/components/appeals/appeal-form'
import { AppealStatusTracker } from '@/components/appeals/appeal-status-tracker'

export const metadata: Metadata = {
  title: 'Подать апелляцию — PeptideTrust',
  description: 'Оспорьте активный флаг участника через арбитражную процедуру PeptideTrust.',
}

export default function AppealsNewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">

          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/catalog" className="hover:text-foreground transition-colors">
              Каталог
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Апелляция</span>
          </nav>

          {/* Status tracker — always visible, starts at submitted */}
          <div
            className="rounded-2xl border border-border bg-card shadow-stripe-sm px-6 py-5 sm:px-8 mb-4"
          >
            <p className="text-xs font-semibold text-[#3c4f69] mb-4">Статус апелляции</p>
            <AppealStatusTracker currentStatus="submitted" />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-card shadow-stripe-md overflow-hidden">

            {/* Card header */}
            <div className="border-b border-border px-6 pt-6 pb-5 sm:px-8">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: '#e8e9ff', color: '#533afd' }}
                >
                  <Scale className="size-5" />
                </div>

                <div className="space-y-1 min-w-0">
                  <h1 className="text-lg font-semibold text-[#061b31] leading-tight">
                    Апелляция на флаг
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Оспорьте активный флаг участника. Заявление рассматривается
                    независимой панелью арбитражных рецензентов.
                  </p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <Suspense>
                <AppealForm />
              </Suspense>
            </div>
          </div>

          {/* Procedure note card */}
          <div className="mt-4 rounded-2xl border border-border bg-card px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold text-[#3c4f69] mb-3">
              Порядок формирования панели
            </p>
            <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-4">
              {[
                {
                  step: '01',
                  title: 'VRF-выбор',
                  body: 'Кандидаты в рецензенты выбираются верифицируемо-случайным образом из пула аккредитованных арбитров.',
                },
                {
                  step: '02',
                  title: 'Conflict-screen',
                  body: 'Исключаются все рецензенты с коммерческими или личными связями со сторонами.',
                },
                {
                  step: '03',
                  title: 'Chair-оракул',
                  body: 'Председатель-оракул координирует рассмотрение и обеспечивает процедурную корректность.',
                },
                {
                  step: '04',
                  title: 'Решение обязательно',
                  body: 'Решение панели обязательно (binding) в рамках реестра. Правовой путь вне реестра сохранён.',
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex gap-3">
                  <span
                    className="text-xs font-mono font-semibold shrink-0 mt-0.5"
                    style={{ color: '#533afd' }}
                  >
                    {step}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#061b31]">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
