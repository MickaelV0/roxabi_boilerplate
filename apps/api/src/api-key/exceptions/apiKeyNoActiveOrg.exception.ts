import { ErrorCode } from '../../common/errorCodes.js'

export class ApiKeyNoActiveOrgException extends Error {
  static readonly errorCode = ErrorCode.API_KEY_NO_ACTIVE_ORG
  readonly errorCode = ApiKeyNoActiveOrgException.errorCode

  constructor() {
    super('Active organization required')
    this.name = 'ApiKeyNoActiveOrgException'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
