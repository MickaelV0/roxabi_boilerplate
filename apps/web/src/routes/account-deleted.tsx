import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/account-deleted')({
  component: AccountDeletedPage,
  head: () => ({
    meta: [{ title: 'Account Deleted | Roxabi' }],
  }),
})

function AccountDeletedPage() {
  // TODO: implement — show deletion confirmation with scheduled purge date
  // TODO: implement — show reactivation instructions (log in before grace period expires)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Account Scheduled for Deletion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your account has been scheduled for deletion. All your data will be permanently removed
            after the 30-day grace period.
          </p>
          <p className="text-sm text-muted-foreground">
            If you change your mind, simply log back in before the grace period expires to
            reactivate your account.
          </p>
          <Button variant="outline" asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
