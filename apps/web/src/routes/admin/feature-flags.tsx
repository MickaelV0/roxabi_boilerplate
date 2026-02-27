import type { FeatureFlag } from '@repo/types'
import { Card, Skeleton } from '@repo/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { FlagIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CreateFlagDialog } from '@/components/admin/CreateFlagDialog'
import { FlagListItem } from '@/components/admin/FlagListItem'
import { isErrorWithMessage } from '@/lib/errorUtils'
import { featureFlagQueries } from '@/lib/featureFlags/queries'
import { featureFlagKeys } from '@/lib/featureFlags/queryKeys'
import { enforceRoutePermission } from '@/lib/routePermissions'

export const Route = createFileRoute('/admin/feature-flags')({
  staticData: { permission: 'role:superadmin' },
  beforeLoad: async (ctx) => {
    await enforceRoutePermission(ctx)
    await ctx.context.queryClient.ensureQueryData(featureFlagQueries.list())
  },
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

function useToggleFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null)
        throw new Error(isErrorWithMessage(body) ? body.message : 'Failed to update feature flag')
      }
      return res.json() as Promise<FeatureFlag>
    },
    onSuccess: () => {
      toast.success('Feature flag updated')
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.list() })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

function useDeleteFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => null)
        throw new Error(isErrorWithMessage(body) ? body.message : 'Failed to delete feature flag')
      }
    },
    onSuccess: () => {
      toast.success('Feature flag deleted')
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.list() })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

function FeatureFlagsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery(featureFlagQueries.list())
  const toggleMutation = useToggleFeatureFlag()
  const deleteMutation = useDeleteFeatureFlag()

  const flags = data ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FlagIcon className="size-6 text-foreground" />
          <h1 className="text-2xl font-bold">Feature Flags</h1>
        </div>
        <CreateFlagDialog
          onCreated={() => queryClient.invalidateQueries({ queryKey: featureFlagKeys.list() })}
        />
      </div>

      {/* Loading state */}
      {isLoading && <FlagsSkeleton />}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load feature flags</p>
          <p className="text-xs text-muted-foreground">Please try refreshing the page</p>
        </div>
      )}

      {/* Empty state */}
      {!(isLoading || isError) && flags.length === 0 && <EmptyState />}

      {/* Flag list */}
      {!(isLoading || isError) && flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((flag) => (
            <FlagListItem
              key={flag.id}
              flag={flag}
              onToggle={async (id, enabled) => toggleMutation.mutate({ id, enabled })}
              onDelete={async (id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
