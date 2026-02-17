// Domain exception — pure TypeScript, no NestJS imports (per backend-patterns §1.3)
import { ErrorCode } from '../../common/error-codes.js'

export class ConsentInsertFailedException extends Error {
  static readonly errorCode = ErrorCode.CONSENT_INSERT_FAILED
  readonly errorCode = ConsentInsertFailedException.errorCode

  constructor(public readonly userId: string) {
    super(`Failed to insert consent record for user ${userId}`)
    this.name = 'ConsentInsertFailedException'
  }
}
