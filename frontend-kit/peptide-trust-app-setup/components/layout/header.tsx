'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Menu, X, ShieldCheck, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

const navItems = [
  { label: 'Каталог',   href: '/catalog' },
  { label: 'Сравнение', href: '/compare' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { isLoggedIn, user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-stripe-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-brand-600 transition-transform duration-150 group-hover:scale-105">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold tracking-heading text-neutral-990 select-none">
            PeptideTrust
          </span>
        </Link>

        {/* Desktop search */}
        <div className="hidden flex-1 max-w-sm md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input
              placeholder="Поиск по имени, ID участника, хешу…"
              className="h-8 rounded-md pl-8 text-sm border-input bg-background focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm rounded-sm text-neutral-600 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Desktop CTA — conditional on auth */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn && user ? (
            <>
              {/* Avatar chip */}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-25"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white select-none"
                  aria-hidden="true"
                >
                  {user.initials}
                </span>
                Кабинет
              </Link>
              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-25 hover:text-neutral-700"
                aria-label="Выйти"
              >
                <LogOut size={13} />
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-brand-600 transition-colors duration-150 hover:text-brand-700"
              >
                Войти
              </Link>
              <Link
                href="/claim"
                className="inline-flex h-8 items-center justify-center rounded-sm bg-brand-600 px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Заявить профиль
              </Link>
            </>
          )}
        </div>

        {/* Mobile search toggle */}
        <button
          aria-label="Поиск"
          className="md:hidden p-2 rounded-sm text-neutral-500 transition-colors hover:bg-neutral-25 hover:text-neutral-700"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Mobile menu toggle */}
        <button
          aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
          className="md:hidden p-2 rounded-sm text-neutral-500 transition-colors hover:bg-neutral-25 hover:text-neutral-700"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input autoFocus placeholder="Поиск..." className="h-9 rounded-md pl-8 text-sm" />
          </div>
        </div>
      )}

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-sm px-3 py-2 text-sm text-neutral-600 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-600"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-2 pt-2 border-t border-border">
              {isLoggedIn && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex flex-1 items-center gap-2 rounded-sm py-2 pl-1 pr-3 text-sm font-medium text-neutral-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white select-none">
                      {user.initials}
                    </span>
                    Кабинет
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="rounded-sm px-3 py-2 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex-1 text-center rounded-sm py-2 text-sm text-brand-600 transition-colors duration-150 hover:text-brand-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/claim"
                    className="flex-1 text-center rounded-sm bg-brand-600 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    Заявить профиль
                  </Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
