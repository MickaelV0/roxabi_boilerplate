import type { AdminUser } from '@repo/types'

export function statusVariant(
  user: Pick<AdminUser, 'banned' | 'deletedAt'>
): 'default' | 'destructive' | 'secondary' {
  if (user.banned) return 'destructive'
  if (user.deletedAt) return 'secondary'
  return 'default'
}

export function statusLabel(user: Pick<AdminUser, 'banned' | 'deletedAt'>): string {
  if (user.banned) return 'Banned'
  if (user.deletedAt) return 'Archived'
  return 'Active'
}
