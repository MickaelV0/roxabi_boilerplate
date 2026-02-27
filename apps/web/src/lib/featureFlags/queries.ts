import type { FeatureFlag } from '@repo/types'
import { queryOptions } from '@tanstack/react-query'
import { featureFlagKeys } from './queryKeys'

export const featureFlagQueries = {
  list: () =>
    queryOptions({
      queryKey: featureFlagKeys.list(),
      queryFn: async ({ signal }): Promise<FeatureFlag[]> => {
        const res = await fetch('/api/admin/feature-flags', {
          credentials: 'include',
          signal,
        })
        if (!res.ok) throw new Error('Failed to fetch feature flags')
        return res.json() as Promise<FeatureFlag[]>
      },
    }),
}
