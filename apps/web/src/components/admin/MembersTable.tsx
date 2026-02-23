import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui'
import { RoleSelect } from '@/components/admin/RoleSelect'
import type { Member, OrgRole } from '@/components/admin/types'
import { roleBadgeVariant, roleLabel } from '@/lib/org-utils'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

type MembersTableProps = {
  members: Member[]
  roles: OrgRole[]
  onRoleChange: (memberId: string, roleId: string) => void
  onRemove: (memberId: string) => void
}

export function MembersTable({ members, roles, onRoleChange, onRemove }: MembersTableProps) {
  const locale = getLocale()

  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="border-b text-left text-muted-foreground">
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_name()}</TableHead>
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_email()}</TableHead>
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_role()}</TableHead>
            <TableHead className="pb-2 pr-4 font-medium">{m.org_members_joined()}</TableHead>
            <TableHead className="pb-2 font-medium">{m.org_members_actions()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} className="border-b last:border-0">
              <TableCell className="py-3 pr-4">
                {member.user.name ?? (
                  <span className="italic text-muted-foreground">{m.admin_members_no_name()}</span>
                )}
              </TableCell>
              <TableCell className="py-3 pr-4 text-muted-foreground">{member.user.email}</TableCell>
              <TableCell className="py-3 pr-4">
                {member.role !== 'owner' && roles.length > 0 ? (
                  <RoleSelect
                    currentRole={member.role}
                    roles={roles}
                    onRoleChange={(roleId) => onRoleChange(member.id, roleId)}
                  />
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Badge variant={roleBadgeVariant(member.role)}>
                            {roleLabel(member.role)}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{m.admin_owner_role_tooltip()}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </TableCell>
              <TableCell className="py-3 pr-4 text-muted-foreground">
                {new Date(member.createdAt).toLocaleDateString(locale)}
              </TableCell>
              <TableCell className="py-3">
                {member.role !== 'owner' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemove(member.id)}
                  >
                    {m.org_members_remove()}
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block px-3 py-1 text-sm text-muted-foreground/50">
                          --
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{m.admin_owner_remove_tooltip()}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
