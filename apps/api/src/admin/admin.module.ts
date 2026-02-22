import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AuthModule } from '../auth/auth.module.js'
import { AdminMembersController } from './admin-members.controller.js'
import { AdminMembersService } from './admin-members.service.js'
import { AdminExceptionFilter } from './filters/admin-exception.filter.js'

@Module({
  imports: [AuthModule],
  controllers: [AdminMembersController],
  providers: [AdminMembersService, { provide: APP_FILTER, useClass: AdminExceptionFilter }],
  exports: [AdminMembersService],
})
export class AdminModule {}
