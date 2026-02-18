// Domain exception — pure TypeScript, no NestJS imports (per backend-patterns §1.3)
import { ErrorCode } from '../../common/error-codes.js'

export class ConsentNotFoundException extends Error {
  static readonly errorCode = ErrorCode.CONSENT_NOT_FOUND
  readonly errorCode = ConsentNotFoundException.errorCode

  constructor(private readonly userId: string) {
    super('No consent record found')
    this.name = 'ConsentNotFoundException'
  }

  getUserId(): string {
    return this.userId
  }
}
