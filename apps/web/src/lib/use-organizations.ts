import { useCallback, useEffect, useState } from 'react'

type Organization = {
  id: string
  name: string
  slug: string
  logo: string | null
  createdAt: string
}

export function useOrganizations() {
  const [data, setData] = useState<Organization[] | undefined>(undefined)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: version triggers manual refetch
  useEffect(() => {
    let cancelled = false
    fetch('/api/organizations', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((orgs: Organization[]) => {
        if (!cancelled) setData(orgs)
      })
      .catch(() => {
        if (!cancelled) setData([])
      })
    return () => {
      cancelled = true
    }
  }, [version])

  return { data, refetch }
}
