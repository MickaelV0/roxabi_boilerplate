import { ErrorCode } from '../../common/errorCodes.js'

export class ApiKeyInsertFailedException extends Error {
  static readonly errorCode = ErrorCode.API_KEY_INSERT_FAILED
  readonly errorCode = ApiKeyInsertFailedException.errorCode

  constructor() {
    super('Failed to insert API key')
    this.name = 'ApiKeyInsertFailedException'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
