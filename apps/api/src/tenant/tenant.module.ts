import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
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
  ],
  exports: [TenantService],
})
export class TenantModule {}
