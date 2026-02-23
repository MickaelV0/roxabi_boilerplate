import { Button } from '@repo/ui'

type LoadMoreButtonProps = {
  onClick: () => void
  hasMore: boolean
  isLoading: boolean
}

/**
 * LoadMoreButton — "Load more" button for cursor-paginated lists.
 * Only renders when hasMore is true. Shows loading spinner when fetching.
 */
export function LoadMoreButton({ onClick, hasMore, isLoading }: LoadMoreButtonProps) {
  if (!hasMore) return null

  // TODO: implement — Button with loading state, centered at bottom of list
  return (
    <div className="flex justify-center py-4">
      <Button variant="outline" onClick={onClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load more'}
      </Button>
    </div>
  )
}
