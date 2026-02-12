import { Inject, Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { and, eq } from 'drizzle-orm'
import {
  ORGANIZATION_CREATED,
  OrganizationCreatedEvent,
} from '../common/events/organization-created.event.js'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { members } from '../database/schema/auth.schema.js'
import { roles } from '../database/schema/rbac.schema.js'
import { RbacService } from './rbac.service.js'

@Injectable()
export class RbacListener {
  private readonly logger = new Logger(RbacListener.name)

  constructor(
    private readonly rbacService: RbacService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB
  ) {}

  @OnEvent(ORGANIZATION_CREATED)
  async handleOrganizationCreated(event: OrganizationCreatedEvent) {
    this.logger.log(`Seeding default roles for organization ${event.organizationId}`)

    await this.rbacService.seedDefaultRoles(event.organizationId)

    // Assign Owner role to the creator
    const [ownerRole] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.tenantId, event.organizationId), eq(roles.slug, 'owner')))
      .limit(1)

    if (ownerRole) {
      await this.db
        .update(members)
        .set({ roleId: ownerRole.id })
        .where(
          and(
            eq(members.userId, event.creatorUserId),
            eq(members.organizationId, event.organizationId)
          )
        )
    }

    this.logger.log(`Default roles seeded for organization ${event.organizationId}`)
  }
}
