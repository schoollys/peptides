import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface StubLayoutProps {
  children: React.ReactNode
}

export function StubLayout({ children }: StubLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#f8fafd' }}>
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="mx-auto w-full max-w-[680px]">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Shared card wrapper
export function StubCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-border bg-white px-8 py-8"
      style={{ boxShadow: '0 6px 22px 0 rgba(0,55,112,.10), 0 4px 8px 0 rgba(0,59,137,.02)' }}
    >
      {children}
    </div>
  )
}

// Breadcrumb back link
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
      style={{ color: '#64748d' }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </a>
  )
}
