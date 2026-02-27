import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { featureFlagKeys } from './queryKeys'

const featureFlagSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const featureFlagQueries = {
  list: () =>
    queryOptions({
      queryKey: featureFlagKeys.list(),
      queryFn: async ({ signal }) => {
        const res = await fetch('/api/admin/feature-flags', {
          credentials: 'include',
          signal,
        })
        if (!res.ok) throw new Error('Failed to fetch feature flags')
        return z.array(featureFlagSchema).parse(await res.json())
      },
    }),
}
