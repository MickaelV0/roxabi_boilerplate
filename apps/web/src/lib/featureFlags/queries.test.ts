import { describe, expect, it, vi } from 'vitest'
import { featureFlagQueries } from './queries.js'
import { featureFlagKeys } from './queryKeys.js'

describe('featureFlagQueries', () => {
  it('list() returns queryOptions with correct queryKey', () => {
    const opts = featureFlagQueries.list()
    expect(opts.queryKey).toEqual(featureFlagKeys.list())
  })

  it('list() queryFn passes signal to fetch', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    globalThis.fetch = fetchSpy
    const controller = new AbortController()
    await featureFlagQueries.list().queryFn({ signal: controller.signal } as never)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/admin/feature-flags',
      expect.objectContaining({ signal: controller.signal })
    )
  })
})
