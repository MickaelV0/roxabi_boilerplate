import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module.js'
import { AuthModule } from '../auth/auth.module.js'
import { AdminAuditLogsController } from './admin-audit-logs.controller.js'
import { AdminAuditLogsService } from './admin-audit-logs.service.js'
import { AdminInvitationsController } from './admin-invitations.controller.js'
import { AdminInvitationsService } from './admin-invitations.service.js'
import { AdminMembersController } from './admin-members.controller.js'
import { AdminMembersService } from './admin-members.service.js'
import { AdminOrganizationsController } from './admin-organizations.controller.js'
import { AdminOrganizationsDeletionService } from './admin-organizations.deletion.js'
import { AdminOrganizationsService } from './admin-organizations.service.js'
import { AdminUsersController } from './admin-users.controller.js'
import { AdminUsersLifecycleService } from './admin-users.lifecycle.js'
import { AdminUsersService } from './admin-users.service.js'

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [
    AdminMembersController,
    AdminInvitationsController,
    AdminUsersController,
    AdminOrganizationsController,
    AdminAuditLogsController,
  ],
  providers: [
    AdminMembersService,
    AdminInvitationsService,
    AdminUsersService,
    AdminUsersLifecycleService,
    AdminOrganizationsService,
    AdminOrganizationsDeletionService,
    AdminAuditLogsService,
  ],
  exports: [
    AdminMembersService,
    AdminInvitationsService,
    AdminUsersService,
    AdminUsersLifecycleService,
    AdminOrganizationsService,
    AdminOrganizationsDeletionService,
    AdminAuditLogsService,
  ],
})
export class AdminModule {}
