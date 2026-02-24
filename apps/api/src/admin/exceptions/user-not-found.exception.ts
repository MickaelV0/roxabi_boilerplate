import { ErrorCode } from '../../common/error-codes.js'

export class AdminUserNotFoundException extends Error {
  static readonly errorCode = ErrorCode.ADMIN_USER_NOT_FOUND
  readonly errorCode = AdminUserNotFoundException.errorCode

  constructor(userId: string) {
    super(`User "${userId}" not found`)
    this.name = 'AdminUserNotFoundException'
  }
}
