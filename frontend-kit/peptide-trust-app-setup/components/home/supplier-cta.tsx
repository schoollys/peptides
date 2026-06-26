import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export function SupplierCTA() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-25 to-brand-50 px-6 py-6">
          {/* Icon + text */}
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600">
              <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-990">
                Вы производитель или поставщик?
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                Заявите профиль и получите независимую оценку доверия, которую видят покупатели при выборе.
              </p>
            </div>
          </div>

          <Link
            href="/claim"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Заявить профиль
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
