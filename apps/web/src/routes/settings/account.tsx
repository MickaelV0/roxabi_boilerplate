import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/settings/account')({
  component: AccountSettingsPage,
  head: () => ({
    meta: [{ title: 'Account Settings | Roxabi' }],
  }),
})

function AccountSettingsPage() {
  // TODO: implement — const { data: session } = useSession()

  // TODO: implement — detect OAuth-only account (hide email/password sections)
  // TODO: implement — email change section
  //   - Input for new email
  //   - Call authClient.changeEmail({ newEmail })
  //   - Show toast on success/error
  // TODO: implement — password change section
  //   - Inputs for current password, new password, confirmation
  //   - Client-side validation (password match)
  //   - Call authClient.changePassword({ currentPassword, newPassword })
  // TODO: implement — delete account section (danger zone)
  //   - Check for owned organizations
  //   - Org ownership resolution modal (transfer or delete each org)
  //   - DestructiveConfirmDialog with email confirmation
  //   - Call DELETE api/users/me
  //   - Redirect to /account-deleted on success

  return (
    <div className="space-y-6">
      {/* Email Change Section */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Change your email address. A verification link will be sent to the new address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input id="newEmail" type="email" placeholder="new@example.com" />
            </div>
            <Button type="submit">Change Email</Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: implement — delete account button + org ownership resolution + confirmation dialog */}
          <Button variant="destructive">Delete My Account</Button>
        </CardContent>
      </Card>
    </div>
  )
}
