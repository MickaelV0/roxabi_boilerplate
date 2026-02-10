import { APP_FILTER, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { UserNotFoundFilter } from './filters/user-not-found.filter.js'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, { provide: APP_FILTER, useClass: UserNotFoundFilter }],
  exports: [UserService],
})
export class UserModule {}
