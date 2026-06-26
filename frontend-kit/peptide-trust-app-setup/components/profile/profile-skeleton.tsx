import { Skeleton } from '@/components/ui/skeleton'

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-8 shadow-stripe-sm">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-8 w-64 rounded-md" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Skeleton className="h-32 w-48 rounded-xl" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[72, 56, 64, 96, 48].map((w, i) => (
            <Skeleton key={i} className="h-8 rounded-md" style={{ width: w }} />
          ))}
        </div>

        {/* Content skeleton: 4 stat cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-stripe-xs">
              <Skeleton className="mb-2 h-3 w-20 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </div>

        {/* Factor cards skeleton */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-stripe-xs space-y-3">
              <div className="flex justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="h-7 w-10 rounded" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-14 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
