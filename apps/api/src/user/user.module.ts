import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AccountAlreadyDeletedFilter } from './filters/account-already-deleted.filter.js'
import { AccountNotDeletedFilter } from './filters/account-not-deleted.filter.js'
import { EmailConfirmationMismatchFilter } from './filters/email-confirmation-mismatch.filter.js'
import { TransferTargetNotMemberFilter } from './filters/transfer-target-not-member.filter.js'
import { UserNotFoundFilter } from './filters/user-not-found.filter.js'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'

@Module({
  // No AuthModule import needed: the Session decorator is standalone (createParamDecorator),
  // and the APP_GUARD (AuthGuard) is globally provided by AuthModule — no circular dependency.
  controllers: [UserController],
  providers: [
    UserService,
    { provide: APP_FILTER, useClass: UserNotFoundFilter },
    { provide: APP_FILTER, useClass: EmailConfirmationMismatchFilter },
    { provide: APP_FILTER, useClass: TransferTargetNotMemberFilter },
    { provide: APP_FILTER, useClass: AccountAlreadyDeletedFilter },
    { provide: APP_FILTER, useClass: AccountNotDeletedFilter },
  ],
  exports: [UserService],
})
export class UserModule {}
