import { ErrorCode } from '../../common/error-codes.js'

export class EmailConflictException extends Error {
  static readonly errorCode = ErrorCode.EMAIL_CONFLICT
  readonly errorCode = EmailConflictException.errorCode

  constructor() {
    super('A user with this email already exists')
    this.name = 'EmailConflictException'
  }
}
