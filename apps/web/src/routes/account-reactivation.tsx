import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/account-reactivation')({
  component: AccountReactivationPage,
  head: () => ({
    meta: [{ title: 'Reactivate Account | Roxabi' }],
  }),
})

function AccountReactivationPage() {
  // TODO: implement — const { data: session } = useSession()

  // TODO: implement — show account deletion schedule (deleteScheduledFor date)
  // TODO: implement — reactivation button
  //   - Call POST api/users/me/reactivate
  //   - On success: redirect to /dashboard
  //   - On error: show toast
  // TODO: implement — show banner for orgs pending deletion (if user reactivated but orgs are still soft-deleted)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Account Scheduled for Deletion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your account is scheduled for permanent deletion. You can reactivate it now to restore
            full access.
          </p>
          {/* TODO: implement — show deleteScheduledFor date */}
          <Button>Reactivate My Account</Button>
        </CardContent>
      </Card>
    </div>
  )
}
