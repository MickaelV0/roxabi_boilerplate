import { ErrorCode } from '../../common/error-codes.js'

export class SelfRoleChangeException extends Error {
  static readonly errorCode = ErrorCode.SELF_ROLE_CHANGE
  readonly errorCode = SelfRoleChangeException.errorCode

  constructor() {
    super('Cannot change your own role')
    this.name = 'SelfRoleChangeException'
  }
}
