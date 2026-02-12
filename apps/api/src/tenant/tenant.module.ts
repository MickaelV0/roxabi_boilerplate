import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { DatabaseUnavailableFilter } from './filters/database-unavailable.filter.js'
import { TenantContextMissingFilter } from './filters/tenant-context-missing.filter.js'
import { TenantInterceptor } from './tenant.interceptor.js'
import { TenantService } from './tenant.service.js'

@Global()
@Module({
  providers: [
    TenantService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: TenantContextMissingFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseUnavailableFilter,
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}
