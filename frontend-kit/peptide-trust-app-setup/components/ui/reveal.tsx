'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Задержка появления в мс — для каскада дочерних блоков. */
  delay?: number
  /** Тег обёртки (по умолчанию div). */
  as?: ElementType
}

/**
 * Появление блока при попадании во вьюпорт (fade + slide-up).
 * Использует IntersectionObserver; при prefers-reduced-motion CSS отключает анимацию.
 * Если IO недоступен — блок сразу видим (graceful degradation).
 */
export function Reveal({ children, className, delay = 0, as }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={delay ? ({ ['--reveal-delay' as string]: `${delay}ms` }) : undefined}
    >
      {children}
    </Tag>
  )
}
