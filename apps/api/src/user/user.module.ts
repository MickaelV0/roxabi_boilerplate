import { forwardRef, Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AuthModule } from '../auth/auth.module.js'
import { EmailConfirmationMismatchFilter } from './filters/email-confirmation-mismatch.filter.js'
import { UserNotFoundFilter } from './filters/user-not-found.filter.js'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: APP_FILTER, useClass: UserNotFoundFilter },
    { provide: APP_FILTER, useClass: EmailConfirmationMismatchFilter },
  ],
  exports: [UserService],
})
export class UserModule {}
