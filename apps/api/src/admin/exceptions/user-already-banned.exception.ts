import { ErrorCode } from '../../common/error-codes.js'

export class UserAlreadyBannedException extends Error {
  static readonly errorCode = ErrorCode.USER_ALREADY_BANNED
  readonly errorCode = UserAlreadyBannedException.errorCode

  constructor(userId: string) {
    super(`User "${userId}" is already banned`)
    this.name = 'UserAlreadyBannedException'
  }
}
