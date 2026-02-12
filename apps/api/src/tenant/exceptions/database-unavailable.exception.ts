import { ErrorCode } from '../../common/error-codes.js'

export class DatabaseUnavailableException extends Error {
  static readonly errorCode = ErrorCode.DATABASE_UNAVAILABLE
  readonly errorCode = DatabaseUnavailableException.errorCode

  constructor() {
    super('Database not available')
  }
}
