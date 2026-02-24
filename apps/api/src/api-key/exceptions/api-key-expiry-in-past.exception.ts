import { ErrorCode } from '../../common/error-codes.js'

export class ApiKeyExpiryInPastException extends Error {
  static readonly errorCode = ErrorCode.API_KEY_EXPIRY_IN_PAST
  readonly errorCode = ApiKeyExpiryInPastException.errorCode

  constructor() {
    super('Expiry date must be in the future')
    this.name = 'ApiKeyExpiryInPastException'
  }
}
