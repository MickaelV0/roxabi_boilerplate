import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Session } from '../auth/decorators/session.decorator.js'
import { OrganizationService } from './organization.service.js'

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('api/organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an organization' })
  @ApiResponse({ status: 200, description: 'Organization scheduled for deletion' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteOrganization(
    @Param('id') orgId: string,
    @Session() session: { user: { id: string }; session: { id: string } },
    @Body() _body: { confirmName: string }
  ) {
    // TODO: implement — validate confirmName matches org name (case-insensitive)
    // TODO: implement — check organizations:delete permission
    // TODO: implement — set deletedAt + deleteScheduledFor (now + 30 days)
    // TODO: implement — clear activeOrganizationId on all sessions referencing this org
    // TODO: implement — invalidate pending invitations (set status = 'expired')
    return this.organizationService.softDelete(orgId, session.user.id)
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a soft-deleted organization' })
  @ApiResponse({ status: 200, description: 'Organization reactivated' })
  async reactivateOrganization(
    @Param('id') orgId: string,
    @Session() session: { user: { id: string } }
  ) {
    // TODO: implement — verify user is owner of the org
    // TODO: implement — clear deletedAt and deleteScheduledFor
    return this.organizationService.reactivate(orgId, session.user.id)
  }

  @Get(':id/deletion-impact')
  @ApiOperation({ summary: 'Get deletion impact summary' })
  @ApiResponse({ status: 200, description: 'Impact summary' })
  async getDeletionImpact(
    @Param('id') orgId: string,
    @Session() _session: { user: { id: string } }
  ) {
    // TODO: implement — return { memberCount, invitationCount, customRoleCount }
    return this.organizationService.getDeletionImpact(orgId)
  }
}
