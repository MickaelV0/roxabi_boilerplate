import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui'
import { MemberContextMenu, MemberKebabButton } from '@/components/admin/member-context-menu'
import type { Member, OrgRole } from '@/components/admin/types'
import { roleBadgeVariant, roleLabel } from '@/lib/org-utils'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

type MembersTableProps = {
  members: Member[]
  roles: OrgRole[]
  orgId: string
  currentUserId: string
  onActionComplete: () => void
}

export function MembersTable({
  members,
  roles,
  orgId,
  currentUserId,
  onActionComplete,
}: MembersTableProps) {
  const locale = getLocale()
  const roleIdBySlug = new Map(roles.map((r) => [r.slug, r.id]))

  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="border-b text-left text-muted-foreground">
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_name()}</TableHead>
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_email()}</TableHead>
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_role()}</TableHead>
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_joined()}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const memberForMenu = {
              id: member.id,
              userId: member.userId ?? member.user.id,
              name: member.user.name ?? '',
              email: member.user.email,
              role: member.role,
              roleId: roleIdBySlug.get(member.role) ?? null,
            }
            return (
              <MemberContextMenu
                key={member.id}
                member={memberForMenu}
                orgId={orgId}
                currentUserId={currentUserId}
                onActionComplete={onActionComplete}
              >
                <TableRow className="border-b last:border-0">
                  <TableCell className="py-3 pr-4">
                    {member.user.name ?? (
                      <span className="italic text-muted-foreground">
                        {m.admin_members_no_name()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 pr-4 text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  <TableCell className="py-3 pr-4">
                    <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
                  </TableCell>
                  <TableCell className="py-3 pr-4 text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell className="py-3">
                    <MemberKebabButton
                      member={memberForMenu}
                      orgId={orgId}
                      currentUserId={currentUserId}
                      onActionComplete={onActionComplete}
                    />
                  </TableCell>
                </TableRow>
              </MemberContextMenu>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
