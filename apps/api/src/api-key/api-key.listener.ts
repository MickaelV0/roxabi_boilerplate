import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
  ORGANIZATION_SOFT_DELETED,
  OrganizationSoftDeletedEvent,
} from '../common/events/organization-soft-deleted.event.js'
import {
  USER_SOFT_DELETED,
  UserSoftDeletedEvent,
} from '../common/events/user-soft-deleted.event.js'
import { ApiKeyService } from './api-key.service.js'

@Injectable()
export class ApiKeyListener {
  private readonly logger = new Logger(ApiKeyListener.name)

  constructor(private readonly apiKeyService: ApiKeyService) {}

  @OnEvent(USER_SOFT_DELETED)
  async handleUserSoftDeleted(event: UserSoftDeletedEvent) {
    this.logger.log(`Revoking all API keys for soft-deleted user ${event.userId}`)
    await this.apiKeyService.revokeAllForUser(event.userId)
  }

  @OnEvent(ORGANIZATION_SOFT_DELETED)
  async handleOrgSoftDeleted(event: OrganizationSoftDeletedEvent) {
    this.logger.log(`Revoking all API keys for soft-deleted organization ${event.organizationId}`)
    await this.apiKeyService.revokeAllForOrg(event.organizationId)
  }
}
