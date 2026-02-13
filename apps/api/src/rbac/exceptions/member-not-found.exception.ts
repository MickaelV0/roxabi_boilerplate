import { ErrorCode } from '../../common/error-codes.js'

export class MemberNotFoundException extends Error {
  static readonly errorCode = ErrorCode.MEMBER_NOT_FOUND
  readonly errorCode = MemberNotFoundException.errorCode

  constructor(memberId: string) {
    super(`Member "${memberId}" not found`)
    this.name = 'MemberNotFoundException'
  }
}
