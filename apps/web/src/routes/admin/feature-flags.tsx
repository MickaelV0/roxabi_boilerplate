import type { FeatureFlag } from '@repo/types'
import { Card, Skeleton } from '@repo/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { FlagIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CreateFlagDialog } from '@/components/admin/CreateFlagDialog'
import { FlagListItem } from '@/components/admin/FlagListItem'
import { isErrorWithMessage } from '@/lib/errorUtils'
import { enforceRoutePermission } from '@/lib/routePermissions'

export const Route = createFileRoute('/admin/feature-flags')({
  staticData: { permission: 'role:superadmin' },
  beforeLoad: enforceRoutePermission,
  component: FeatureFlagsPage,
  head: () => ({ meta: [{ title: 'Feature Flags | Admin | Roxabi' }] }),
})

function FlagsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <Card key={i}>
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <FlagIcon className="size-10 text-muted-foreground/50" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">No feature flags yet</p>
        <p className="text-xs text-muted-foreground">Create your first flag to get started</p>
      </div>
    </div>
  )
}

function useFeatureFlagActions() {
  const queryClient = useQueryClient()
  const queryKey = ['admin', 'feature-flags']

  async function handleToggle(id: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null)
        const message = isErrorWithMessage(body) ? body.message : 'Failed to update feature flag'
        toast.error(message)
        return
      }

      toast.success('Feature flag updated')
      await queryClient.invalidateQueries({ queryKey })
    } catch {
      toast.error('Failed to update feature flag')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null)
        const message = isErrorWithMessage(body) ? body.message : 'Failed to delete feature flag'
        toast.error(message)
        return
      }

      toast.success('Feature flag deleted')
      await queryClient.invalidateQueries({ queryKey })
    } catch {
      toast.error('Failed to delete feature flag')
    }
  }

  function handleCreated() {
    queryClient.invalidateQueries({ queryKey })
  }

  return { handleToggle, handleDelete, handleCreated }
}

function FeatureFlagsPage() {
  const { data, isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/feature-flags', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch feature flags')
      return res.json()
    },
  })

  const flags = data ?? []
  const { handleToggle, handleDelete, handleCreated } = useFeatureFlagActions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FlagIcon className="size-6 text-foreground" />
          <h1 className="text-2xl font-bold">Feature Flags</h1>
        </div>
        <CreateFlagDialog onCreated={handleCreated} />
      </div>

      {/* Loading state */}
      {isLoading && <FlagsSkeleton />}

      {/* Empty state */}
      {!isLoading && flags.length === 0 && <EmptyState />}

      {/* Flag list */}
      {!isLoading && flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((flag) => (
            <FlagListItem
              key={flag.id}
              flag={flag}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
