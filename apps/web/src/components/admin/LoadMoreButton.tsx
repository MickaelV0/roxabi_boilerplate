import { Button } from '@repo/ui'
import { useEffect, useRef } from 'react'

type LoadMoreButtonProps = {
  onClick: () => void
  hasMore: boolean
  isLoading: boolean
}

/**
 * LoadMoreButton -- "Load more" button for cursor-paginated lists.
 * Only renders when hasMore is true. Shows loading spinner when fetching.
 * Automatically triggers loading when the button scrolls into view via IntersectionObserver.
 */
export function LoadMoreButton({ onClick, hasMore, isLoading }: LoadMoreButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = buttonRef.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && hasMore && !isLoading) {
        onClick()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onClick])

  if (!hasMore) return null

  return (
    <div className="flex justify-center py-4">
      <Button ref={buttonRef} variant="outline" onClick={onClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load more'}
      </Button>
    </div>
  )
}
