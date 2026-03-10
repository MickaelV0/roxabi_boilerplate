import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module.js'
import { ApiKeyController } from './apiKey.controller.js'
import { ApiKeyListener } from './apiKey.listener.js'
import { API_KEY_REPO } from './apiKey.repository.js'
import { ApiKeyService } from './apiKey.service.js'
import { DrizzleApiKeyRepository } from './repositories/drizzleApiKey.repository.js'

@Module({
  imports: [AuditModule],
  controllers: [ApiKeyController],
  providers: [
    ApiKeyService,
    ApiKeyListener,
    { provide: API_KEY_REPO, useClass: DrizzleApiKeyRepository },
  ],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
