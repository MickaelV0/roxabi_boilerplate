export const USER_SOFT_DELETED = 'user.soft-deleted' as const

export class UserSoftDeletedEvent {
  constructor(public readonly userId: string) {}
}
