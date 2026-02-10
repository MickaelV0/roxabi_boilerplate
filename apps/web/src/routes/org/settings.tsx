import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

// TODO: import authClient from '@/lib/auth-client'
// TODO: import toast from 'sonner'
// TODO: import Dialog for delete confirmation
// TODO: import Paraglide messages

export const Route = createFileRoute('/org/settings')({
  component: OrgSettingsPage,
})

/**
 * Organization Settings page.
 *
 * Owner can edit org name, slug, and delete the organization.
 * Non-owners see a read-only view.
 */
function OrgSettingsPage() {
  // TODO: fetch current organization from auth session
  // TODO: check user role (owner vs non-owner)
  // TODO: implement name/slug edit form
  // TODO: implement save with authClient.organization.update()
  // TODO: implement delete with confirmation dialog
  // TODO: implement loading states
  // TODO: implement i18n with Paraglide messages

  const [_name, _setName] = useState('')
  const [_slug, _setSlug] = useState('')
  const [_loading, _setLoading] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Organization Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            {/* TODO: bind to state, read-only for non-owners */}
            <Input id="org-name" placeholder="My Organization" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            {/* TODO: bind to state, read-only for non-owners */}
            <Input id="org-slug" placeholder="my-org" />
          </div>
          {/* TODO: show save button only for owners */}
          <Button>Save changes</Button>
        </CardContent>
      </Card>

      {/* TODO: danger zone — delete organization (owner only, with confirmation) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: implement delete with Dialog confirmation */}
          <Button variant="destructive" disabled>
            Delete organization
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
