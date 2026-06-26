import { Suspense } from 'react'
import { ComparePageClient } from '@/components/compare/compare-page-client'
import { CompareTableSkeleton } from '@/components/compare/compare-table'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata = { title: 'Сравнение — PeptideTrust' }

export default function ComparePage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="min-h-screen bg-[#f8fafd]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <CompareTableSkeleton cols={3} />
            </div>
          </main>
        }
      >
        <ComparePageClient />
      </Suspense>
      <Footer />
    </>
  )
}
