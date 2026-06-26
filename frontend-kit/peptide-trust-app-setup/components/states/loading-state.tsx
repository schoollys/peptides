import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

// ---- Card skeleton (used in catalog grid) ----
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-[16px] border border-[#e5edf5] bg-white p-5',
        'shadow-[0_5px_14px_0_rgba(0,55,112,.08),0_2px_8px_0_rgba(0,59,137,.05)]',
        className,
      )}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
      </div>
      {/* score row */}
      <div className="mt-4 flex items-end gap-2">
        <Skeleton className="h-9 w-16 rounded" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {/* factor row */}
      <Skeleton className="mt-3 h-3 w-44 rounded" />
      {/* meta row */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </div>
  )
}

// ---- Panel skeleton (used in profile / dashboard) ----
function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-[16px] border border-[#e5edf5] bg-white p-6',
        'shadow-[0_5px_14px_0_rgba(0,55,112,.08),0_2px_8px_0_rgba(0,59,137,.05)]',
        className,
      )}
    >
      <Skeleton className="h-4 w-32 rounded mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
        <Skeleton className="h-3 w-4/6 rounded" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-[12px]" />
        <Skeleton className="h-12 rounded-[12px]" />
      </div>
    </div>
  )
}

// ---- Table skeleton ----
function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-[16px] border border-[#e5edf5] bg-white overflow-hidden',
        'shadow-[0_5px_14px_0_rgba(0,55,112,.08),0_2px_8px_0_rgba(0,59,137,.05)]',
        className,
      )}
    >
      {/* thead */}
      <div className="border-b border-[#e5edf5] px-5 py-3 flex gap-4">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-3 w-16 rounded ml-auto" />
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-4 px-5 py-3.5',
            i < rows - 1 && 'border-b border-[#e5edf5]',
          )}
        >
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-3.5 w-40 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-5 w-10 rounded" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}

// ---- Hero skeleton (used in profile hero / dashboard score) ----
function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-[16px] bg-[#0d253d] p-7 flex items-start justify-between gap-6',
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48 rounded bg-white/10" />
        <Skeleton className="h-4 w-32 rounded bg-white/10" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
          <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-16 w-24 rounded bg-white/10" />
        <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
      </div>
    </div>
  )
}

// ---- Badge skeleton (instant from cache note) ----
function BadgeSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'inline-flex items-center gap-3 rounded-[12px] border border-[#e5edf5] bg-white px-4 py-2.5',
        'shadow-[0_2px_10px_0_rgba(0,55,112,.06),0_1px_4px_0_rgba(0,59,137,.04)]',
        className,
      )}
    >
      <Skeleton className="h-8 w-12 rounded" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-4 w-24 rounded" />
    </div>
  )
}

// ---- Generic LoadingState wrapper (adds aria-busy + label) ----
interface LoadingStateProps {
  variant: 'cards' | 'panel' | 'table' | 'hero' | 'badge'
  count?: number
  label?: string
  className?: string
}

function LoadingState({ variant, count = 3, label = 'Загрузка…', className }: LoadingStateProps) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={cn('w-full', className)}>
      <span className="sr-only">{label}</span>
      {variant === 'cards' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {variant === 'panel' && <PanelSkeleton />}
      {variant === 'table' && <TableSkeleton rows={count} />}
      {variant === 'hero'  && <HeroSkeleton />}
      {variant === 'badge' && <BadgeSkeleton />}
    </div>
  )
}

export { LoadingState, CardSkeleton, PanelSkeleton, TableSkeleton, HeroSkeleton, BadgeSkeleton }
export type { LoadingStateProps }
