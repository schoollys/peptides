import { Skeleton } from '@/components/ui/skeleton'

export function ParticipantCardSkeleton() {
  return (
    <div
      className="rounded-[16px] bg-card p-5"
      style={{
        boxShadow: '0 5px 14px 0 rgba(0,55,112,.08), 0 2px 8px 0 rgba(0,59,137,.05)',
        border:    '1px solid rgba(212,222,233,.6)',
      }}
    >
      {/* Name + role */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Score + tier */}
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-8 w-12" style={{ borderRadius: '4px' }} />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Dominant factor */}
      <Skeleton className="mt-2.5 h-3 w-2/3" />

      {/* Meta row */}
      <div
        className="mt-3 flex items-center gap-2 border-t pt-3"
        style={{ borderColor: 'rgba(212,222,233,.6)' }}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-28" />
      </div>
    </div>
  )
}
