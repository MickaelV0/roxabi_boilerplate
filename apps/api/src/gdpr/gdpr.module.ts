import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { GdprController } from './gdpr.controller.js'
import { GdprService } from './gdpr.service.js'

@Module({
  imports: [AuthModule],
  controllers: [GdprController],
  providers: [GdprService],
  exports: [GdprService],
})
export class GdprModule {}
