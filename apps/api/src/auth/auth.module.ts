import { forwardRef, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { RbacModule } from '../rbac/rbac.module.js'
import { AuthController } from './auth.controller.js'
import { AuthGuard } from './auth.guard.js'
import { AuthService } from './auth.service.js'
import { EMAIL_PROVIDER } from './email/email.provider.js'
import { ResendEmailProvider } from './email/resend.provider.js'

@Module({
  imports: [forwardRef(() => RbacModule)],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: EMAIL_PROVIDER, useClass: ResendEmailProvider },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
