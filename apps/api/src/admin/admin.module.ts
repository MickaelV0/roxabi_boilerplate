import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module.js'
import { AuthModule } from '../auth/auth.module.js'
import { AdminInvitationsController } from './admin-invitations.controller.js'
import { AdminMembersController } from './admin-members.controller.js'
import { AdminMembersService } from './admin-members.service.js'

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AdminMembersController, AdminInvitationsController],
  providers: [AdminMembersService],
  exports: [AdminMembersService],
})
export class AdminModule {}
