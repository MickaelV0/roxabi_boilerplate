import { ErrorCode } from '../../common/error-codes.js'

export class RoleSlugConflictException extends Error {
  static readonly errorCode = ErrorCode.ROLE_SLUG_CONFLICT
  readonly errorCode = RoleSlugConflictException.errorCode

  constructor(slug: string) {
    super(`Role with slug "${slug}" already exists`)
    this.name = 'RoleSlugConflictException'
  }
}
