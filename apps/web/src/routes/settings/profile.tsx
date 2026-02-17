import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/settings/profile')({
  component: ProfileSettingsPage,
  head: () => ({
    meta: [{ title: 'Profile Settings | Roxabi' }],
  }),
})

function ProfileSettingsPage() {
  // TODO: implement — const { data: session } = useSession()

  // TODO: implement — fetch user profile with new fields (firstName, lastName, fullName, avatarSeed, avatarStyle)
  // TODO: implement — form state for firstName, lastName, fullName
  // TODO: implement — fullName auto-update logic (when fullNameCustomized is false)
  // TODO: implement — DiceBear avatar selector with real-time preview
  //   - Style selector dropdown (lorelei, bottts, pixel-art, thumbs, avataaars)
  //   - Optional custom seed input (defaults to user ID)
  //   - Real-time avatar preview (client-side generation)
  // TODO: implement — save profile via PATCH api/users/me

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Display Name</Label>
              <Input id="fullName" placeholder="Display name" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: implement — DiceBear avatar selector */}
          <p className="text-sm text-muted-foreground">Avatar customization coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
