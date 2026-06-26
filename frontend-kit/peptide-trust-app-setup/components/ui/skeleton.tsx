import { cn } from "@/lib/utils"

/**
 * Skeleton — shimmer placeholder.
 * Uses a 90deg linear-gradient sweep (#eee → #f5f4f1 → #eee) at 1.3s.
 * Pass variant="dark" for skeletons on navy/dark card backgrounds.
 */
interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "light" | "dark"
}

function Skeleton({ className, variant = "light", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-md",
        variant === "dark" ? "animate-shimmer-dark" : "animate-shimmer",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
