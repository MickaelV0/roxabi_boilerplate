import { ErrorCode } from '../../common/error-codes.js'

export class SuperadminProtectionException extends Error {
  static readonly errorCode = ErrorCode.SUPERADMIN_PROTECTION
  readonly errorCode = SuperadminProtectionException.errorCode

  constructor() {
    super('Cannot modify another superadmin account')
    this.name = 'SuperadminProtectionException'
  }
}
