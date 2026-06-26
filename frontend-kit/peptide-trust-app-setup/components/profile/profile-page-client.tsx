'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Users } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProfileHero } from '@/components/profile/profile-hero'
import { TabOverview } from '@/components/profile/tab-overview'
import { TabFactors } from '@/components/profile/tab-factors'
import { TabHistory } from '@/components/profile/tab-history'
import { TabIntegrity } from '@/components/profile/tab-integrity'
import { ProfileSkeleton } from '@/components/profile/profile-skeleton'
import { ProfileError } from '@/components/profile/profile-error'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import type { ParticipantProfile } from '@/lib/profile-data'
import { ANCHOR_ROLE_CODES } from '@/lib/catalog-data'

type LoadState = 'loading' | 'loaded' | 'error' | 'not_found'

const VALID_TABS = ['overview', 'factors', 'history', 'integrity'] as const
type TabValue = typeof VALID_TABS[number]

function isValidTab(t: string | null): t is TabValue {
  return VALID_TABS.includes(t as TabValue)
}

function generateRequestId() {
  return 'req_' + Math.random().toString(36).slice(2, 10)
}

interface Props {
  id: string
  /** Server-resolved profile (SSR). null = unknown id → not_found UI. */
  initialProfile: ParticipantProfile | null
}

export function ProfilePageClient({ id, initialProfile }: Props) {
  const router = useRouter()

  const [state, setState] = useState<LoadState>(initialProfile ? 'loaded' : 'not_found')
  const [profile, setProfile] = useState<ParticipantProfile | null>(initialProfile)
  const [requestId] = useState(() => generateRequestId())
  const [retryCount, setRetryCount] = useState(0)
  const [activeTab, setActiveTab] = useState<TabValue>('overview')
  const tabScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = tabScrollRef.current
    if (!el) return
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = tabScrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect() }
  }, [checkScroll, state])

  // Deep-link support: read ?tab= on the client after mount.
  // Kept out of SSR (no useSearchParams) so the page can be statically prerendered with content.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (isValidTab(t)) setActiveTab(t)
  }, [])

  function handleTabChange(value: string) {
    const tab = isValidTab(value) ? value : 'overview'
    setActiveTab(tab)
    const url = tab === 'overview' ? `/p/${id}` : `/p/${id}?tab=${tab}`
    router.replace(url, { scroll: false })
  }

  // Re-fetch only on explicit retry (initial data comes from SSR props).
  useEffect(() => {
    if (retryCount === 0) return
    let cancelled = false
    setState('loading')
    setProfile(null)
    fetch(`/api/participants/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: ParticipantProfile) => {
        if (cancelled) return
        setProfile(data)
        setState('loaded')
      })
      .catch((status) => {
        if (cancelled) return
        setState(status === 404 ? 'not_found' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [id, retryCount])

  return (
    <>
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb bar */}
        <div
          className="border-b border-border"
          style={{ background: 'rgba(248,250,253,.8)', backdropFilter: 'blur(4px)' }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm text-muted-foreground sm:px-6 lg:px-8">
            <Link
              href="/catalog"
              className="flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <Users size={13} />
              Каталог
            </Link>
            <ChevronLeft size={13} className="rotate-180 opacity-40" />
            <span className="truncate font-medium text-foreground/80">
              {state === 'loaded' && profile ? profile.display_name : id}
            </span>
          </div>
        </div>

        {/* Page body */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {state === 'loading' && <ProfileSkeleton />}

          {state === 'error' && (
            <ProfileError
              requestId={requestId}
              onRetry={() => setRetryCount((c) => c + 1)}
            />
          )}

          {state === 'not_found' && (
            <ProfileError notFound />
          )}

          {state === 'loaded' && profile && (
            <div className="space-y-6">
              {/* Hero */}
              <ProfileHero profile={profile} />

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                {/* Scroll-fade wrapper: shows right gradient when content overflows */}
                <div className="relative">
                  <div
                    ref={tabScrollRef}
                    className="overflow-x-auto scrollbar-none"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <TabsList
                      variant="line"
                      className="min-w-max w-full justify-start border-b border-border pb-0 h-auto rounded-none bg-transparent gap-0"
                    >
                      {[
                        { value: 'overview',   label: 'Обзор' },
                        { value: 'factors',    label: 'Из чего складывается оценка' },
                        { value: 'history',    label: 'История' },
                        { value: 'integrity',  label: 'Подлинность записи' },
                        { value: 'relations',  label: 'Связи', disabled: true },
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          disabled={tab.disabled}
                          aria-disabled={tab.disabled}
                          className="rounded-none px-4 pb-3 pt-1 text-sm data-active:border-b-2 data-active:border-primary data-active:text-primary whitespace-nowrap"
                        >
                          {tab.label}
                          {tab.disabled && (
                            <span
                              className="ml-1.5 rounded-full px-1.5 py-px text-[10px] font-medium"
                              style={{ background: 'rgba(100,116,141,.12)', color: '#64748d' }}
                            >
                              скоро
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  {/* Right-edge scroll affordance — fades out when fully scrolled */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-12 transition-opacity duration-200"
                    style={{
                      background: 'linear-gradient(to right, transparent, white)',
                      opacity: canScrollRight ? 1 : 0,
                    }}
                  />
                </div>

                {/* Non-anchor role provisional callout */}
                {!ANCHOR_ROLE_CODES.includes(profile.role_code) && (
                  <div
                    className="mt-4 flex gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: 'rgba(201,162,39,.07)',
                      border:     '1px solid rgba(201,162,39,.28)',
                    }}
                    role="note"
                  >
                    <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a6800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p className="text-sm leading-relaxed" style={{ color: '#6b4f00' }}>
                      <span className="font-semibold">Данные пока собираются.</span>{' '}
                      Эту роль мы оцениваем частично. Полная проверка и оценка надёжности
                      для неё появятся позже.
                    </p>
                  </div>
                )}

                <div className="pt-6">
                  <TabsContent value="overview">
                    <TabOverview profile={profile} />
                  </TabsContent>

                  <TabsContent value="factors">
                    <TabFactors profile={profile} />
                  </TabsContent>

                  <TabsContent value="history">
                    <TabHistory profile={profile} />
                  </TabsContent>

                  <TabsContent value="integrity">
                    <TabIntegrity profile={profile} />
                  </TabsContent>

                  {/* Relations disabled stub */}
                  <TabsContent value="relations">
                    <div className="py-14 text-center text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Граф связей — скоро</p>
                      <p className="mt-1">
                        Визуализация цепочек поставок и аффилированных участников появится в следующей версии.
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
    </>
  )
}
