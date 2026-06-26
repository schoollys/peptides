import type { Metadata } from 'next'
import { ProfilePageClient } from '@/components/profile/profile-page-client'
import { ROLE_LABELS } from '@/lib/profile-data'
import type { Participant } from '@/lib/participants'
import { fetchAllParticipants, fetchParticipant } from '@/lib/data'

interface Props {
  params: Promise<{ id: string }>
}

// Pre-render all known participant profiles as static HTML (real SSR content for SEO).
export async function generateStaticParams() {
  const all = await fetchAllParticipants()
  return all.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const p = await fetchParticipant(id)

  if (!p) {
    return {
      title: 'Участник не найден — PeptideTrust',
      description: 'Запрошенный профиль участника отсутствует в реестре PeptideTrust.',
      robots: { index: false, follow: true },
    }
  }

  const scoreLabel = p.score != null ? p.score.toFixed(1) : 'New / Provisional'
  const tierLabel = p.score != null ? ` · ${p.tier}` : ''
  const title = `${p.display_name} — Trust Score ${scoreLabel}${tierLabel} | PeptideTrust`
  const description =
    p.score != null
      ? `${p.display_name} (${ROLE_LABELS[p.role_code]}, ${p.jurisdiction}) — независимый Trust Score ${p.score.toFixed(1)}/100, тир ${p.tier}. ${p.tests_count} независимых тестов. Проверьте верификацию в реестре PeptideTrust.`
      : `${p.display_name} (${ROLE_LABELS[p.role_code]}, ${p.jurisdiction}) — провизорный профиль, идёт накопление данных. Реестр доверия PeptideTrust.`
  const url = `/p/${p.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      siteName: 'PeptideTrust',
      title,
      description,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// JSON-LD structured data: Organization + AggregateRating (only when scored).
function ProfileJsonLd({ p }: { p: Participant | null }) {
  if (!p) return null

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: p.display_name,
    url: `https://${p.domain}`,
    identifier: p.id,
    address: { '@type': 'PostalAddress', addressCountry: p.jurisdiction },
  }

  if (p.score != null) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.score,
      bestRating: 100,
      worstRating: 0,
      ratingCount: p.tests_count,
      ratingExplanation: `Trust Score ${p.score.toFixed(1)} (${p.tier}) — PeptideTrust`,
    }
  }

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const profile = await fetchParticipant(id)

  return (
    <>
      <ProfileJsonLd p={profile} />
      <ProfilePageClient id={id} initialProfile={profile} />
    </>
  )
}
