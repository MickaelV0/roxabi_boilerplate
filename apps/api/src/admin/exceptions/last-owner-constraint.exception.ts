import { ErrorCode } from '../../common/error-codes.js'

export class LastOwnerConstraintException extends Error {
  static readonly errorCode = ErrorCode.LAST_OWNER_CONSTRAINT
  readonly errorCode = LastOwnerConstraintException.errorCode

  constructor() {
    super('Cannot remove the last owner of the organization')
    this.name = 'LastOwnerConstraintException'
  }
}
