'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { ParticipantProfile } from '@/lib/profile-data'
import { BadgePreviewCard } from '@/components/badge/badge-preview'
import { BadgeCodeBlock } from '@/components/badge/badge-code-block'
import { BadgeExternalPreview } from '@/components/badge/badge-external-preview'
import { BadgeNotes } from '@/components/badge/badge-notes'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

// ── Loading skeleton ─────────────────────────────────────────────────────────
function BadgePageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Skeleton className="h-4 w-32 mb-8" />
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-80 mb-10" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-[16px] border border-[#e5edf5] p-6 flex flex-col gap-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-36 w-full rounded-[12px]" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="rounded-[16px] border border-[#e5edf5] p-6 flex flex-col gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full rounded-[10px]" />
          <Skeleton className="h-8 w-full rounded-[8px]" />
        </div>
      </div>
    </div>
  )
}

// ── Not found state ──────────────────────────────────────────────────────────
function NotFound({ id }: { id: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
      <p className="text-[#64748d] mb-4">Участник с ID <code className="font-mono text-[#533afd]">{id}</code> не найден.</p>
      <Link href="/catalog" className="text-sm text-[#533afd] hover:underline">
        Вернуться в каталог
      </Link>
    </div>
  )
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold text-[#3c4f69] uppercase tracking-[0.06em] mb-4">
      {children}
    </h2>
  )
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="border-t border-[#e5edf5]" />
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BadgePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [profile, setProfile] = useState<ParticipantProfile | null | undefined>(undefined)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    let active = true
    setProfile(undefined)
    fetch(`/api/participants/${encodeURIComponent(id)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (active) setProfile(data as ParticipantProfile | null) })
      .catch(() => { if (active) setProfile(null) })
    return () => { active = false }
  }, [id])

  return (
    <>
      <title>{profile ? `Бейдж — ${profile.display_name} — PeptideTrust` : 'Бейдж — PeptideTrust'}</title>
      <Header />
      <main className="min-h-screen bg-[#f8fafd]">
        {/* ── Loading ── */}
        {profile === undefined && <BadgePageSkeleton />}

        {/* ── Not found ── */}
        {profile === null && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <NotFound id={id} />
          </div>
        )}

        {/* ── Content ── */}
        {profile && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

            {/* Back link */}
            <Link
              href={`/p/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#533afd] hover:text-[#4032c8] transition-colors mb-8"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Профиль участника
            </Link>

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
              <div>
                <h1 className="text-2xl font-semibold text-[#061b31] tracking-heading mb-1">
                  Trust Badge
                </h1>
                <p className="text-[#64748d] text-sm leading-relaxed">
                  Встраиваемый бейдж для{' '}
                  <span className="font-medium text-[#3c4f69]">{profile.display_name}</span>.
                  Данные обновляются автоматически с сервера PeptideTrust.
                </p>
              </div>
              <a
                href={`/p/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-[6px] text-xs font-medium text-[#533afd] border border-[#d6d9fc] bg-[#f5f5ff] hover:bg-[#e8e9ff] transition-colors"
              >
                Открыть профиль
                <ArrowUpRight size={12} strokeWidth={2} />
              </a>
            </div>

            {/* ── Top two-column card ── */}
            <div
              className="rounded-[16px] bg-white border border-[#e5edf5] mb-8 overflow-hidden"
              style={{ boxShadow: '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)' }}
            >
              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#e5edf5]">

                {/* Left: badge preview + theme toggle */}
                <div className="p-6 lg:p-8">
                  <SectionHeading>Превью бейджа</SectionHeading>
                  <BadgePreviewCard profile={profile} theme={theme} onThemeChange={setTheme} />
                </div>

                {/* Right: embed code */}
                <div className="p-6 lg:p-8">
                  <SectionHeading>Код для вставки</SectionHeading>
                  <BadgeCodeBlock id={id} displayName={profile.display_name} theme={theme} />
                </div>
              </div>
            </div>

            {/* ── External site preview ── */}
            <div
              className="rounded-[16px] bg-white border border-[#e5edf5] p-6 lg:p-8 mb-8"
              style={{ boxShadow: '0 5px 14px 0 rgba(0,55,112,.08), 0 2px 8px 0 rgba(0,59,137,.05)' }}
            >
              <SectionHeading>Превью на стороннем сайте</SectionHeading>
              <BadgeExternalPreview profile={profile} />
            </div>

            {/* ── Technical notes ── */}
            <div
              className="rounded-[16px] bg-white border border-[#e5edf5] p-6 lg:p-8"
              style={{ boxShadow: '0 5px 14px 0 rgba(0,55,112,.08), 0 2px 8px 0 rgba(0,59,137,.05)' }}
            >
              <SectionHeading>Как работает бейдж</SectionHeading>
              <BadgeNotes />

              <Divider />

              {/* Mini API reference */}
              <div className="mt-6 flex flex-col gap-2">
                <p className="text-[12px] font-semibold text-[#3c4f69] uppercase tracking-wide mb-2">
                  Эндпоинт
                </p>
                <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-[#e5edf5] bg-[#f8fafd] px-4 py-3">
                  <span className="text-[11px] font-bold text-[#8ca0b8] uppercase tracking-widest">GET</span>
                  <code className="text-[13px] font-mono text-[#533afd]">
                    /badge/{'{id}'}.svg
                  </code>
                  <div className="ml-auto flex flex-wrap gap-2">
                    {[
                      { label: 'Content-Type', value: 'image/svg+xml' },
                      { label: 'Cache-Control', value: 'public, max-age=300' },
                      { label: 'X-PeptideTrust-Sig', value: 'HMAC-SHA256' },
                    ].map((h) => (
                      <span
                        key={h.label}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#e8e9ff] text-[#3c3c8c]"
                      >
                        <span className="text-[#8ca0b8]">{h.label}:</span>
                        {h.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
