import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/home/hero'
import { TrustMarquee } from '@/components/home/trust-marquee'
import { Audience } from '@/components/home/audience'
import { Features } from '@/components/home/features'
import { Stats } from '@/components/home/stats'
import { SupplierCTA } from '@/components/home/supplier-cta'
import { RecentEntries } from '@/components/home/recent-entries'
import { Reveal } from '@/components/ui/reveal'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustMarquee />
        <Reveal>
          <Audience />
        </Reveal>
        <Reveal>
          <Features />
        </Reveal>
        <Reveal>
          <Stats />
        </Reveal>
        <Reveal>
          <SupplierCTA />
        </Reveal>
        <Reveal>
          <RecentEntries />
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
