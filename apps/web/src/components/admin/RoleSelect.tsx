import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui'
import { roleLabel } from '@/lib/org-utils'

type OrgRole = {
  id: string
  name: string
  slug: string
}

type RoleSelectProps = {
  currentRole: string
  roles: OrgRole[]
  onRoleChange: (roleId: string) => void
  disabled?: boolean
}

export function RoleSelect({ currentRole, roles, onRoleChange, disabled }: RoleSelectProps) {
  const currentRoleObj = roles.find((r) => r.slug === currentRole)
  const currentRoleId = currentRoleObj?.id ?? ''

  return (
    <Select value={currentRoleId} onValueChange={onRoleChange} disabled={disabled}>
      <SelectTrigger className="h-7 w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {roleLabel(role.slug)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
