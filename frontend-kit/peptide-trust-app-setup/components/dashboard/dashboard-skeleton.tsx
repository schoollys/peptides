import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Score hero skeleton — dark bg */}
      <div className="rounded-2xl bg-neutral-900 p-8">
        <div className="mb-6 flex gap-3">
          <Skeleton variant="dark" className="h-4 w-28" />
          <Skeleton variant="dark" className="h-4 w-16" />
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-4">
            <Skeleton variant="dark" className="h-20 w-40" />
            <div className="mb-2 flex flex-col gap-2">
              <Skeleton variant="dark" className="h-5 w-20" />
              <Skeleton variant="dark" className="h-4 w-28" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Skeleton variant="dark" className="h-4 w-32" />
            <Skeleton variant="dark" className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton variant="dark" className="h-7 w-24" />
              <Skeleton variant="dark" className="h-7 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-2xl border border-neutral-50 bg-card p-5 shadow-stripe-sm"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Alerts section skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-neutral-25 p-5"
          >
            <div className="mb-4 flex justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-7 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
