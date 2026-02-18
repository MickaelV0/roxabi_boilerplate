import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'

type AccountDeletedSearch = {
  purgeDate?: string
  purged?: string
}

export const Route = createFileRoute('/account-deleted')({
  component: AccountDeletedPage,
  validateSearch: (search: Record<string, unknown>): AccountDeletedSearch => ({
    purgeDate: typeof search.purgeDate === 'string' ? search.purgeDate : undefined,
    purged: typeof search.purged === 'string' ? search.purged : undefined,
  }),
  head: () => ({
    meta: [{ title: 'Account Deleted | Roxabi' }],
  }),
})

function AccountDeletedPage() {
  const { purgeDate, purged } = useSearch({ from: '/account-deleted' })

  const isPurged = purged === 'true'
  const formattedDate = purgeDate ? new Date(purgeDate).toLocaleDateString() : null

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>
            {isPurged ? 'Account Permanently Deleted' : 'Account Scheduled for Deletion'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPurged ? (
            <p className="text-muted-foreground">
              Your account and all associated data have been permanently deleted. This action is
              irreversible.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                Your account has been scheduled for deletion.
                {formattedDate
                  ? ` All your data will be permanently removed on ${formattedDate}.`
                  : ' All your data will be permanently removed after the 30-day grace period.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Changed your mind? Simply log back in before the grace period expires to reactivate
                your account. All your data will be restored.
              </p>
            </>
          )}
          <Button variant="outline" asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
