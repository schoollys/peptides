import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CatalogGrid } from '@/components/catalog/catalog-grid'
import { fetchAllParticipants } from '@/lib/data'

export const metadata: Metadata = {
  title:       'Каталог участников — PeptideTrust',
  description: 'Сегментированный публичный каталог производителей, дистрибьюторов и лабораторий пептидного рынка с рейтингом Trust Score.',
}

interface CatalogPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { q } = await searchParams
  const participants = await fetchAllParticipants()
  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-semibold tracking-heading text-balance"
            style={{ color: '#061b31', letterSpacing: '-0.02em' }}
          >
            Каталог участников
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#64748d' }}>
            Компании рынка пептидов с независимой оценкой надёжности — производители,
            дистрибьюторы, лаборатории и ритейлеры.
          </p>
        </div>

        {/* MVP scope banner */}
        <div
          className="mb-6 flex flex-wrap items-start gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(91,120,168,.07)',
            border:     '1px solid rgba(91,120,168,.22)',
          }}
          role="note"
          aria-label="Что сейчас в реестре"
        >
          <p className="text-sm leading-relaxed" style={{ color: '#3c4f69' }}>
            Сейчас полностью оцениваем{' '}
            <span className="font-medium">производителей</span>,{' '}
            <span className="font-medium">лаборатории</span> и{' '}
            <span className="font-medium">организаторов закупок</span> в Европе.
            Остальные участники уже в каталоге — данные по ним пока собираются.
          </p>
        </div>

        {/* Filters + grid */}
        <CatalogGrid participants={participants} initialQuery={q ?? ''} />
      </main>

      <Footer />
    </>
  )
}
