'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WebglMesh } from '@/components/home/webgl-mesh'
import { PARTICIPANTS } from '@/lib/participants'

// Real, existing participants (single source of truth) — never legacy/non-existent names.
const recentSearches = PARTICIPANTS.filter((p) => p.status === 'ACTIVE')
  .slice(0, 3)
  .map((p) => p.display_name)

export function Hero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function runSearch(q: string) {
    const trimmed = q.trim()
    router.push(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : '/catalog')
  }

  return (
    <section className="relative overflow-hidden bg-card">
      {/* CSS-фолбэк (виден, если WebGL недоступен) */}
      <div
        className="stripe-mesh absolute -inset-x-24 -top-1/2 bottom-0 pointer-events-none opacity-45 sm:opacity-55"
        aria-hidden="true"
      />
      {/* Анимированный mesh-градиент на WebGL (сигнатура Stripe Helios) */}
      <WebglMesh className="absolute inset-0 h-full w-full pointer-events-none opacity-55 sm:opacity-65" />
      {/* Мягкое осветление снизу, чтобы текст оставался читаемым */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-card/40 to-card"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center flex flex-col items-center gap-8">
        {/* Label pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-25 px-3 py-1 text-xs font-medium text-brand-600">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
          Нейтральный публичный реестр · Не маркетплейс
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-3 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-[3.25rem] font-light leading-tight tracking-display text-neutral-990">
            Узнайте, каким поставщикам пептидов можно доверять
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-neutral-600">
            Независимая оценка надёжности производителей и поставщиков. Данные проверяются, а не покупаются.
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full max-w-xl">
          <form
            className="relative flex items-center"
            onSubmit={(e) => {
              e.preventDefault()
              runSearch(query)
            }}
            role="search"
          >
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название компании, ID участника или хеш…"
              aria-label="Поиск по реестру"
              className="h-11 rounded-lg border-neutral-200 pl-11 pr-28 text-sm"
            />
            <Button type="submit" className="absolute right-1.5 h-8 rounded-md text-xs">
              Найти
            </Button>
          </form>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="text-xs text-neutral-300">Например:</span>
            {recentSearches.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(s)}
                className="text-xs text-primary hover:text-primary/70 transition-colors duration-150"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* CTA links */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-150"
          >
            Перейти в каталог
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/trust-model"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors duration-150 hover:text-neutral-700"
          >
            Как работает Trust Score
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
