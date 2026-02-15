import { forwardRef, Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AuthModule } from '../auth/auth.module.js'
import { TenantModule } from '../tenant/tenant.module.js'
import { RbacExceptionFilter } from './filters/rbac-exception.filter.js'
import { PermissionService } from './permission.service.js'
import { RbacController } from './rbac.controller.js'
import { RbacListener } from './rbac.listener.js'
import { RbacService } from './rbac.service.js'

@Module({
  imports: [forwardRef(() => AuthModule), TenantModule],
  controllers: [RbacController],
  providers: [
    RbacService,
    PermissionService,
    RbacListener,
    { provide: APP_FILTER, useClass: RbacExceptionFilter },
  ],
  exports: [RbacService, PermissionService],
})
export class RbacModule {}
