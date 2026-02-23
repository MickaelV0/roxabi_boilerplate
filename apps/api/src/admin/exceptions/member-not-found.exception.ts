import { ErrorCode } from '../../common/error-codes.js'

export class AdminMemberNotFoundException extends Error {
  static readonly errorCode = ErrorCode.ADMIN_MEMBER_NOT_FOUND
  readonly errorCode = AdminMemberNotFoundException.errorCode

  constructor(memberId: string) {
    super(`Member "${memberId}" not found`)
    this.name = 'AdminMemberNotFoundException'
  }
}
