import { m } from '@/paraglide/messages'

export function roleLabel(role: string) {
  switch (role) {
    case 'owner':
      return m.org_role_owner()
    case 'admin':
      return m.org_role_admin()
    case 'viewer':
      return m.org_role_viewer()
    default:
      return m.org_role_member()
  }
}

export function roleBadgeVariant(role: string) {
  switch (role) {
    case 'owner':
      return 'default' as const
    case 'admin':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}
