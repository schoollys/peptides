'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** Конечное значение. */
  value: number
  /** Длительность анимации в мс. */
  duration?: number
  /** Кол-во знаков после запятой. */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Разделитель тысяч (по умолчанию неразрывный пробел). */
  separator?: string
  className?: string
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function format(n: number, decimals: number, separator: string): string {
  const fixed = n.toFixed(decimals)
  const [intPart, fracPart] = fixed.split('.')
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return fracPart ? `${withSep}.${fracPart}` : withSep
}

/** Анимированный счётчик: проигрывается один раз при появлении во вьюпорте. */
export function CountUp({
  value,
  duration = 1600,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = '\u00A0',
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setDisplay(value)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            const start = performance.now()
            const tick = (now: number) => {
              const t = Math.min((now - start) / duration, 1)
              // easeOutCubic
              const eased = 1 - Math.pow(1 - t, 3)
              setDisplay(value * eased)
              if (t < 1) requestAnimationFrame(tick)
              else setDisplay(value)
            }
            requestAnimationFrame(tick)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(display, decimals, separator)}
      {suffix}
    </span>
  )
}
