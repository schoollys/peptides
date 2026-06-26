'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Header }        from '@/components/layout/header'
import { Footer }        from '@/components/layout/footer'
import { SubmitForm }    from '@/components/submit/submit-form'
import { SubmitSuccess } from '@/components/submit/submit-success'
import { RequireAuth }   from '@/components/auth/require-auth'
import type { SubmissionResponse } from '@/lib/submit-data'

export default function SubmitPage() {
  const [result, setResult] = useState<SubmissionResponse | null>(null)

  return (
    <>
      <title>Подача данных — PeptideTrust</title>

      <div className="flex min-h-screen flex-col bg-background">
        <Header />

        <RequireAuth>
        <main className="flex-1">
          {/* Page header */}
          <div className="border-b border-border bg-card">
            <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="size-3.5" />
                Кабинет
              </Link>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-heading text-[#061b31]">
                  Подача данных
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
                  Отправьте подтверждающие данные, тесты или артефакты для пересчёта
                  Trust Score участника. Каждая запись подписывается X-Signature.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
            {/* White card */}
            <div className="rounded-2xl bg-card shadow-stripe-md border border-border px-6 py-8 sm:px-8">

              {result ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-[#061b31]">Запись принята</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Пересчёт Trust Score запущен асинхронно.
                    </p>
                  </div>
                  <SubmitSuccess response={result} onReset={() => setResult(null)} />
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-[#061b31]">Новая запись</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Заполните поля ниже. Обязательные поля отмечены{' '}
                      <span style={{ color: '#d8351e' }}>*</span>
                    </p>
                  </div>
                  <SubmitForm onSuccess={setResult} />
                </>
              )}
            </div>

            {/* Vᵢ side note */}
            {!result && (
              <div className="mt-6 rounded-2xl border border-border bg-card px-5 py-4 shadow-stripe-xs">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Как работает Vᵢ (множитель верификации)
                </p>
                <ul className="space-y-1.5 text-xs text-[#3c4f69] leading-relaxed">
                  <li className="flex gap-2">
                    <span className="shrink-0 font-mono text-primary">1.00</span>
                    Полная цепочка хранения: аккредитованный оракул + подписанный CoA
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 font-mono" style={{ color: '#c9a227' }}>≤ 0.70</span>
                    Vendor-grade: образец предоставлен вендором, COA принят
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 font-mono" style={{ color: '#b07a45' }}>≈ 0.45</span>
                    Только самостоятельная декларация без артефакта (NO_ARTIFACT_REVIEW_WEIGHT)
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 font-mono" style={{ color: '#d8351e' }}>0.00</span>
                    Неаккредитованный оракул — данные отклоняются
                  </li>
                </ul>
              </div>
            )}
          </div>
        </main>

        </RequireAuth>
        <Footer />
      </div>
    </>
  )
}
