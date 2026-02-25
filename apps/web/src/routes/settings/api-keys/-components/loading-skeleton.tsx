const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3']

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-2">
        {SKELETON_KEYS.map((id) => (
          <div key={id} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export { LoadingSkeleton }
