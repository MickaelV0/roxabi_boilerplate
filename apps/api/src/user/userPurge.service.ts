import { Inject, Injectable } from '@nestjs/common'
import type { DrizzleTx } from '../database/drizzle.provider.js'
import { AccountNotDeletedException } from './exceptions/accountNotDeleted.exception.js'
import { EmailConfirmationMismatchException } from './exceptions/emailConfirmationMismatch.exception.js'
import { UserNotFoundException } from './exceptions/userNotFound.exception.js'
import { USER_PURGE_REPO, type UserPurgeRepository } from './userPurge.repository.js'

/**
 * UserPurgeService -- purge-specific operations extracted from UserService.
 *
 * Handles: validatePurgeEligibility, anonymizeUserRecords, purgeOwnedOrganizations.
 *
 * Called by UserService.purge() (user-initiated) and PurgeService (cron-based).
 */
@Injectable()
export class UserPurgeService {
  constructor(@Inject(USER_PURGE_REPO) private readonly repo: UserPurgeRepository) {}

  async validatePurgeEligibility(userId: string, confirmEmail: string) {
    const user = await this.repo.findForPurgeValidation(userId)
    if (!user) throw new UserNotFoundException(userId)

    // Only soft-deleted users can purge. The grace period is intentionally
    // bypassed for user-initiated purge -- the user explicitly requested
    // immediate deletion from the reactivation page.
    if (!user.deletedAt) {
      throw new AccountNotDeletedException()
    }

    if (user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
      throw new EmailConfirmationMismatchException()
    }

    return user
  }

  /** Used by PurgeService (purge/) for cron-based anonymization. */
  async anonymizeUserRecords(userId: string, originalEmail: string, now: Date, tx?: DrizzleTx) {
    return this.repo.anonymizeUserRecords(userId, originalEmail, now, tx)
  }

  async purgeOwnedOrganizations(userId: string, now: Date, tx?: DrizzleTx) {
    return this.repo.purgeOwnedOrganizations(userId, now, tx)
  }
}
