import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import { MailIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { roleLabel } from '@/lib/org-utils'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  invitedAt: string
  expiresAt: string
}

type InvitationsResponse = {
  data: Invitation[]
}

async function fetchInvitations(signal?: AbortSignal): Promise<Invitation[]> {
  // TODO: Backend fixer to create GET /api/admin/invitations endpoint
  const res = await fetch('/api/admin/invitations', {
    credentials: 'include',
    signal,
  })
  if (!res.ok) return []
  const json = (await res.json()) as InvitationsResponse
  return json.data ?? []
}

async function revokeInvitation(invitationId: string): Promise<void> {
  const res = await fetch(`/api/admin/invitations/${invitationId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(m.auth_toast_error())
  }
}

type PendingInvitationsProps = {
  /** Incremented to trigger a refetch after new invitations are sent */
  refreshKey?: number
}

export function PendingInvitations({ refreshKey }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const locale = getLocale()

  const load = useCallback((signal?: AbortSignal) => {
    setIsLoading(true)
    setError(false)
    fetchInvitations(signal)
      .then((data) => {
        if (!signal?.aborted) {
          setInvitations(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!signal?.aborted) {
          setError(true)
          setIsLoading(false)
        }
      })
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey triggers manual refetch
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load, refreshKey])

  async function handleRevoke(invitationId: string) {
    try {
      await revokeInvitation(invitationId)
      toast.success(m.org_toast_invitation_revoked())
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
    } catch {
      toast.error(m.auth_toast_error())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailIcon className="size-5" />
          {m.admin_invitations_title()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <div key={i} className="flex items-center gap-4 px-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {m.admin_invitations_error()}
          </p>
        )}

        {!isLoading && !error && invitations.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <MailIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{m.admin_invitations_empty()}</p>
          </div>
        )}

        {!isLoading && !error && invitations.length > 0 && (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b text-left text-muted-foreground">
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.org_invitations_email()}
                  </TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.org_invitations_role()}
                  </TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.org_invitations_status()}
                  </TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.admin_invitations_invited_date()}
                  </TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.admin_invitations_expires()}
                  </TableHead>
                  <TableHead className="pb-2 font-medium">{m.org_members_actions()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id} className="border-b last:border-0">
                    <TableCell className="py-3 pr-4">{invitation.email}</TableCell>
                    <TableCell className="py-3 pr-4">
                      <Badge variant="outline">{roleLabel(invitation.role)}</Badge>
                    </TableCell>
                    <TableCell className="py-3 pr-4">
                      <Badge variant="secondary">{invitation.status}</Badge>
                    </TableCell>
                    <TableCell className="py-3 pr-4 text-muted-foreground">
                      {new Date(invitation.invitedAt).toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell className="py-3 pr-4 text-muted-foreground">
                      {new Date(invitation.expiresAt).toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRevoke(invitation.id)}
                      >
                        {m.admin_invitations_revoke()}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
