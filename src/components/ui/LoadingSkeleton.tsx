interface LoadingSkeletonProps {
  rows?: number
}

export const LoadingSkeleton = ({ rows = 5 }: LoadingSkeletonProps) => (
  <div className="loading-skeleton" aria-label="Loading">
    {Array.from({ length: rows }).map((_, index) => (
      <span key={index} />
    ))}
  </div>
)
