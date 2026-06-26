import { ExternalLink } from 'lucide-react'
import { BadgeSvg } from './badge-preview'
import type { ParticipantProfile } from '@/lib/profile-data'

interface BadgeExternalPreviewProps {
  profile: ParticipantProfile
}

// Simulates how the badge would look embedded on a third-party website
export function BadgeExternalPreview({ profile }: BadgeExternalPreviewProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Simulated third-party page */}
      <div
        className="rounded-[12px] overflow-hidden border border-[#e5edf5]"
        aria-label="Пример встраивания бейджа на сторонний сайт"
      >
        {/* Fake browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0f4f8] border-b border-[#e5edf5]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d8351e] opacity-60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227] opacity-60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#00b261] opacity-60" />
          </div>
          <div className="flex-1 mx-2 rounded-[4px] bg-white border border-[#dce6f0] px-2.5 py-1 text-[11px] text-[#9aa0a6] font-mono">
            supplier-example.com/about
          </div>
        </div>

        {/* Fake page content */}
        <div className="bg-white p-6">
          {/* Fake text blocks */}
          <div className="flex flex-col gap-2 mb-5">
            <div className="h-4 w-48 rounded bg-[#f0f4f8]" />
            <div className="h-3 w-72 rounded bg-[#f5f7fa]" />
            <div className="h-3 w-64 rounded bg-[#f5f7fa]" />
          </div>

          {/* The badge itself, wrapped in a fake link */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-[#9aa0a6] font-medium uppercase tracking-wide">
                Верификация поставщика
              </span>
              <a
                href={`/p/${profile.id}`}
                className="inline-block transition-opacity hover:opacity-80"
                aria-label={`Профиль ${profile.display_name} с ончейн-проверкой`}
              >
                <BadgeSvg profile={profile} theme="light" />
              </a>
              <span className="flex items-center gap-1 text-[11px] text-[#9aa0a6]">
                <ExternalLink size={10} strokeWidth={2} />
                клик ведёт на профиль с ончейн-проверкой
              </span>
            </div>

            {/* Fake more content */}
            <div className="flex-1 flex flex-col gap-2 mt-6">
              <div className="h-3 w-full rounded bg-[#f5f7fa]" />
              <div className="h-3 w-5/6 rounded bg-[#f5f7fa]" />
              <div className="h-3 w-4/5 rounded bg-[#f5f7fa]" />
              <div className="h-3 w-3/4 rounded bg-[#f5f7fa]" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[12px] text-[#9aa0a6] leading-5">
        Бейдж встраивается одним тегом{' '}
        <code className="font-mono text-[#533afd]">&lt;img&gt;</code> или Markdown-ссылкой.
        Данные запрашиваются с сервера PeptideTrust при каждой загрузке страницы.
      </p>
    </div>
  )
}
