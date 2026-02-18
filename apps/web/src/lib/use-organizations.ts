import { useCallback, useEffect, useState } from 'react'
import { fetchOrganizations } from '@/lib/api'

type Organization = {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: string
}

export function useOrganizations() {
  const [data, setData] = useState<Organization[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: version triggers manual refetch
  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    fetchOrganizations(controller.signal)
      .then((res) => (res.ok ? res.json() : []))
      .then((orgs: Organization[]) => {
        if (!controller.signal.aborted) {
          setData(orgs)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch organizations'))
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [version])

  return { data, isLoading, error, refetch }
}
