import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module.js'
import { ApiKeyController } from './api-key.controller.js'
import { ApiKeyListener } from './api-key.listener.js'
import { ApiKeyService } from './api-key.service.js'

@Module({
  imports: [AuditModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyListener],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
