import { cn } from '@/lib/utils'

interface StyleguideSectionProps {
  id?: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function StyleguideSection({
  id,
  title,
  description,
  children,
  className,
}: StyleguideSectionProps) {
  return (
    <section id={id} className={cn('flex flex-col gap-6', className)}>
      <div>
        <h2 className="text-xl font-medium tracking-heading text-neutral-990">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export function StyleguideRow({
  label,
  children,
  vertical,
}: {
  label?: string
  children: React.ReactNode
  vertical?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-300" style={{ letterSpacing: '0.06em' }}>
          {label}
        </p>
      )}
      <div className={cn('flex flex-wrap gap-3 items-center', vertical && 'flex-col items-start')}>
        {children}
      </div>
    </div>
  )
}
