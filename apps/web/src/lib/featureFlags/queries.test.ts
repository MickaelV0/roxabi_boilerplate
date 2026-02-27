import { afterEach, describe, expect, it, vi } from 'vitest'
import { featureFlagQueries } from './queries.js'
import { featureFlagKeys } from './queryKeys.js'

describe('featureFlagQueries', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('list() returns queryOptions with correct queryKey', () => {
    const opts = featureFlagQueries.list()
    expect(opts.queryKey).toEqual(featureFlagKeys.list())
  })

  it('list() queryFn passes signal to fetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) } as Response)
    const controller = new AbortController()
    const opts = featureFlagQueries.list()
    const queryFn = opts.queryFn as NonNullable<typeof opts.queryFn>
    await queryFn({ signal: controller.signal } as never)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/admin/feature-flags',
      expect.objectContaining({ signal: controller.signal })
    )
  })

  it('list() queryFn throws when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(null),
    } as Response)
    const opts = featureFlagQueries.list()
    const queryFn = opts.queryFn as NonNullable<typeof opts.queryFn>
    await expect(queryFn({ signal: new AbortController().signal } as never)).rejects.toThrow(
      'Failed to fetch feature flags'
    )
  })
})
