import { ErrorCode } from '../../common/error-codes.js'

export class InvitationAlreadyPendingException extends Error {
  static readonly errorCode = ErrorCode.INVITATION_ALREADY_PENDING
  readonly errorCode = InvitationAlreadyPendingException.errorCode

  constructor(email: string) {
    super(`A pending invitation already exists for "${email}"`)
    this.name = 'InvitationAlreadyPendingException'
  }
}
