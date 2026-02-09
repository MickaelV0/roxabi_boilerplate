import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
