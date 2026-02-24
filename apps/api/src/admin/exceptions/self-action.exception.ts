import { ErrorCode } from '../../common/error-codes.js'

export class SelfActionException extends Error {
  static readonly errorCode = ErrorCode.SELF_ACTION
  readonly errorCode = SelfActionException.errorCode

  constructor() {
    super('Cannot perform this action on your own account')
    this.name = 'SelfActionException'
  }
}
