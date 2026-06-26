import { BadgeCheck } from 'lucide-react'

// Источники верификации / стандарты, по которым сверяются документы участников.
const SIGNALS = [
  'EU GMP',
  'ISO/IEC 17025',
  'EDQM',
  'Swissmedic',
  'EMA',
  'USP',
  'Ph. Eur.',
  'COA / CoA',
  'GMP+',
  'ISO 9001',
]

function MarqueeRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-10 pr-10"
      aria-hidden={ariaHidden || undefined}
    >
      {SIGNALS.map((s, i) => (
        <li
          key={`${s}-${i}`}
          className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-neutral-400"
        >
          <BadgeCheck className="h-4 w-4 text-neutral-300" strokeWidth={1.75} />
          {s}
        </li>
      ))}
    </ul>
  )
}

export function TrustMarquee() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
          Документы сверяются по официальным стандартам и реестрам
        </p>
        <div className="group/marquee marquee-mask relative overflow-hidden">
          <div className="marquee-track">
            <MarqueeRow />
            <MarqueeRow ariaHidden />
          </div>
        </div>
      </div>
    </section>
  )
}
