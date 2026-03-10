import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { TenantModule } from '../tenant/tenant.module.js'
import { RbacExceptionFilter } from './filters/rbacException.filter.js'
import { PermissionService } from './permission.service.js'
import { RbacController } from './rbac.controller.js'
import { RbacListener } from './rbac.listener.js'
import { RBAC_REPO } from './rbac.repository.js'
import { RbacService } from './rbac.service.js'
import { RBAC_MEMBER_REPO } from './rbacMember.repository.js'
import { RbacMemberService } from './rbacMember.service.js'
import { DrizzleRbacRepository } from './repositories/drizzleRbac.repository.js'
import { DrizzleRbacMemberRepository } from './repositories/drizzleRbacMember.repository.js'

@Module({
  imports: [TenantModule],
  controllers: [RbacController],
  providers: [
    RbacService,
    RbacMemberService,
    PermissionService,
    RbacListener,
    { provide: RBAC_REPO, useClass: DrizzleRbacRepository },
    { provide: RBAC_MEMBER_REPO, useClass: DrizzleRbacMemberRepository },
    { provide: APP_FILTER, useClass: RbacExceptionFilter },
  ],
  exports: [RbacService, RbacMemberService, PermissionService],
})
export class RbacModule {}
