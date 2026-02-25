import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module.js'
import { ApiKeyController } from './apiKey.controller.js'
import { ApiKeyListener } from './apiKey.listener.js'
import { ApiKeyService } from './apiKey.service.js'

@Module({
  imports: [AuditModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyListener],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
