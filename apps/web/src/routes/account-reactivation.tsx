import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { AlertTriangleIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'

type ReactivationSearch = {
  deleteScheduledFor?: string
}

export const Route = createFileRoute('/account-reactivation')({
  component: AccountReactivationPage,
  validateSearch: (search: Record<string, unknown>): ReactivationSearch => ({
    deleteScheduledFor:
      typeof search.deleteScheduledFor === 'string' ? search.deleteScheduledFor : undefined,
  }),
  head: () => ({
    meta: [{ title: 'Reactivate Account | Roxabi' }],
  }),
})

function AccountReactivationPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { deleteScheduledFor } = useSearch({ from: '/account-reactivation' })
  const [reactivating, setReactivating] = useState(false)

  const formattedDate = deleteScheduledFor
    ? new Date(deleteScheduledFor).toLocaleDateString()
    : null

  async function handleReactivate() {
    setReactivating(true)
    try {
      const res = await fetch('/api/users/me/reactivate', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        toast.error(data?.message ?? 'Failed to reactivate account')
        return
      }

      toast.success('Account reactivated successfully')
      navigate({ to: '/dashboard' })
    } catch {
      toast.error('Failed to reactivate account')
    } finally {
      setReactivating(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Account Scheduled for Deletion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Deletion pending</AlertTitle>
            <AlertDescription>
              {formattedDate
                ? `Your account will be permanently deleted on ${formattedDate}.`
                : 'Your account is scheduled for permanent deletion.'}
            </AlertDescription>
          </Alert>

          <p className="text-muted-foreground">
            Your account is currently scheduled for deletion. You can reactivate it now to restore
            full access to your data.
          </p>

          {session?.user && (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium">{session.user.email}</span>
            </p>
          )}

          <Button onClick={handleReactivate} disabled={reactivating} className="w-full">
            {reactivating ? 'Reactivating...' : 'Reactivate My Account'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Note: If you had organizations scheduled for deletion, they will need to be reactivated
            separately from the organization settings page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
