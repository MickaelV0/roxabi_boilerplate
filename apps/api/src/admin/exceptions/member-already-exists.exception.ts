import { ErrorCode } from '../../common/error-codes.js'

export class MemberAlreadyExistsException extends Error {
  static readonly errorCode = ErrorCode.MEMBER_ALREADY_EXISTS
  readonly errorCode = MemberAlreadyExistsException.errorCode

  constructor(email: string) {
    super(`A member with email "${email}" already exists in this organization`)
    this.name = 'MemberAlreadyExistsException'
  }
}
