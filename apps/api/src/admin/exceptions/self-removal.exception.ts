import { ErrorCode } from '../../common/error-codes.js'

export class SelfRemovalException extends Error {
  static readonly errorCode = ErrorCode.SELF_REMOVAL
  readonly errorCode = SelfRemovalException.errorCode

  constructor() {
    super('Cannot remove yourself from the organization')
    this.name = 'SelfRemovalException'
  }
}
