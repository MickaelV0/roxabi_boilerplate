import type { CursorPaginatedResponse } from '@repo/types'

/**
 * useCursorPagination — wraps TanStack Query's useInfiniteQuery for cursor-based pagination.
 *
 * Returns { data, loadMore, hasMore, isLoading, isLoadingMore, error }.
 * Used by all three Phase 2 list pages (users, organizations, audit logs).
 */

// TODO: implement — generic hook that:
// 1. Accepts a fetch function (url, cursor?) => CursorPaginatedResponse<T>
// 2. Uses useInfiniteQuery with getNextPageParam from cursor.next
// 3. Flattens pages into a single data array
// 4. Returns loadMore function, hasMore flag, loading states

export function useCursorPagination<T>(_options: {
  queryKey: unknown[]
  fetchFn: (cursor?: string) => Promise<CursorPaginatedResponse<T>>
  enabled?: boolean
}) {
  // TODO: implement
  return {
    data: [] as T[],
    loadMore: () => {},
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    error: null as Error | null,
  }
}
