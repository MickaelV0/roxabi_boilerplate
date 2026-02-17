// Domain exception — pure TypeScript, no NestJS imports (per backend-patterns §1.3)
import { ErrorCode } from '../../common/error-codes.js'

export class ConsentNotFoundException extends Error {
  static readonly errorCode = ErrorCode.CONSENT_NOT_FOUND
  readonly errorCode = ConsentNotFoundException.errorCode

  constructor(public readonly userId: string) {
    super(`No consent record found for user ${userId}`)
    this.name = 'ConsentNotFoundException'
  }
}
