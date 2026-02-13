import { ErrorCode } from '../../common/error-codes.js'

export class DefaultRoleException extends Error {
  static readonly errorCode = ErrorCode.DEFAULT_ROLE_CONSTRAINT
  readonly errorCode = DefaultRoleException.errorCode

  constructor(message: string) {
    super(message)
    this.name = 'DefaultRoleException'
  }
}
