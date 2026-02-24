import { ErrorCode } from '../../common/error-codes.js'

export class OrgCycleDetectedException extends Error {
  static readonly errorCode = ErrorCode.ADMIN_ORG_CYCLE_DETECTED
  readonly errorCode = OrgCycleDetectedException.errorCode

  constructor() {
    super('Cannot set parent to a descendant organization')
    this.name = 'OrgCycleDetectedException'
  }
}
