import type { CursorPaginatedResponse } from '@repo/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCursorPagination } from './use-cursor-pagination'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return { Wrapper, queryClient }
}

type TestItem = { id: string; name: string }

function createPage(
  items: TestItem[],
  hasMore: boolean,
  next: string | null = null
): CursorPaginatedResponse<TestItem> {
  return {
    data: items,
    cursor: { hasMore, next },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCursorPagination', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return empty data and loading state initially', () => {
    // Arrange
    const fetchFn = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    const { Wrapper } = createQueryWrapper()

    // Act
    const { result } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-initial'],
          fetchFn,
        }),
      { wrapper: Wrapper }
    )

    // Assert
    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should return data after first page loads', async () => {
    // Arrange
    const page1 = createPage([{ id: '1', name: 'Alice' }], false)
    const fetchFn = vi.fn().mockResolvedValue(page1)
    const { Wrapper } = createQueryWrapper()

    // Act
    const { result } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-first-page'],
          fetchFn,
        }),
      { wrapper: Wrapper }
    )

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.data).toEqual([{ id: '1', name: 'Alice' }])
    expect(result.current.hasMore).toBe(false)
    expect(result.current.error).toBeNull()
    expect(fetchFn).toHaveBeenCalledWith(undefined)
  })

  it('should indicate hasMore when cursor says more pages exist', async () => {
    // Arrange
    const page1 = createPage([{ id: '1', name: 'Alice' }], true, 'cursor-abc')
    const fetchFn = vi.fn().mockResolvedValue(page1)
    const { Wrapper } = createQueryWrapper()

    // Act
    const { result } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-has-more'],
          fetchFn,
        }),
      { wrapper: Wrapper }
    )

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.hasMore).toBe(true)
    expect(result.current.data).toHaveLength(1)
  })

  it('should load next page with cursor when loadMore is called', async () => {
    // Arrange
    const page1 = createPage([{ id: '1', name: 'Alice' }], true, 'cursor-abc')
    const page2 = createPage([{ id: '2', name: 'Bob' }], false)
    const fetchFn = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)
    const { Wrapper } = createQueryWrapper()

    // Act
    const { result } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-load-more'],
          fetchFn,
        }),
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Act — load next page
    result.current.loadMore()

    // Assert
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })
    expect(result.current.data).toEqual([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ])
    expect(result.current.hasMore).toBe(false)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(fetchFn).toHaveBeenNthCalledWith(2, 'cursor-abc')
  })

  it('should expose error when fetchFn rejects', async () => {
    // Arrange
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'))
    const { Wrapper } = createQueryWrapper()

    // Act
    const { result } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-error'],
          fetchFn,
        }),
      { wrapper: Wrapper }
    )

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('Network error')
    expect(result.current.data).toEqual([])
  })

  it('should not fetch when enabled is false', async () => {
    // Arrange
    const fetchFn = vi.fn().mockResolvedValue(createPage([], false))
    const { Wrapper } = createQueryWrapper()

    // Act
    const { result } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-disabled'],
          fetchFn,
          enabled: false,
        }),
      { wrapper: Wrapper }
    )

    // Assert — wait a tick to confirm it stays idle
    await new Promise((r) => setTimeout(r, 50))
    expect(fetchFn).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('should refetch data when refetch is called', async () => {
    // Arrange
    const page1 = createPage([{ id: '1', name: 'Alice' }], false)
    const page1Updated = createPage([{ id: '1', name: 'Alice Updated' }], false)
    const fetchFn = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce(page1Updated)
    const { Wrapper } = createQueryWrapper()

    // Act
    const { result } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-refetch'],
          fetchFn,
        }),
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.data[0]?.name).toBe('Alice')

    // Act — trigger refetch
    result.current.refetch()

    // Assert
    await waitFor(() => {
      expect(result.current.data[0]?.name).toBe('Alice Updated')
    })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('should reset data when queryKey changes (simulating filter change)', async () => {
    // Arrange
    const page1 = createPage([{ id: '1', name: 'Alice' }], false)
    const page2 = createPage([{ id: '2', name: 'Bob' }], false)
    const fetchFn = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)
    const { Wrapper } = createQueryWrapper()

    let filter = 'active'

    // Act — render with first filter
    const { result, rerender } = renderHook(
      () =>
        useCursorPagination<TestItem>({
          queryKey: ['test-filter', filter],
          fetchFn,
        }),
      { wrapper: Wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.data).toEqual([{ id: '1', name: 'Alice' }])

    // Act — change filter and rerender
    filter = 'banned'
    rerender()

    // Assert — new queryKey triggers new fetch
    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: '2', name: 'Bob' }])
    })
  })
})
