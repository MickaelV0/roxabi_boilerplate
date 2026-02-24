import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { z } from 'zod'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { Session } from '../auth/decorators/session.decorator.js'
import type { AuthenticatedSession } from '../auth/types.js'
import { SkipOrg } from '../common/decorators/skip-org.decorator.js'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import { AdminMembersService } from './admin-members.service.js'
import { AdminOrganizationsService } from './admin-organizations.service.js'
import { AdminExceptionFilter } from './filters/admin-exception.filter.js'

const changeMemberRoleSchema = z.object({
  roleId: z.string().uuid(),
})

type ChangeMemberRoleDto = z.infer<typeof changeMemberRoleSchema>

const createOrgSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  parentOrganizationId: z.string().uuid().nullable().optional(),
})

const updateOrgSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  parentOrganizationId: z.string().uuid().nullable().optional(),
})

type CreateOrgDto = z.infer<typeof createOrgSchema>
type UpdateOrgDto = z.infer<typeof updateOrgSchema>

@ApiTags('Admin Organizations')
@ApiBearerAuth()
@UseFilters(AdminExceptionFilter)
@Throttle({ global: { ttl: 60_000, limit: 30 } })
@Roles('superadmin')
@SkipOrg()
@Controller('api/admin/organizations')
export class AdminOrganizationsController {
  constructor(
    private readonly adminOrganizationsService: AdminOrganizationsService,
    private readonly adminMembersService: AdminMembersService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations (flat or tree view)' })
  @ApiResponse({ status: 200, description: 'Organization list' })
  async listOrganizations(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('view') view?: string
  ) {
    if (view === 'tree') {
      return this.adminOrganizationsService.listOrganizationsForTree()
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
    const filters = {
      status: status || undefined,
      search: search?.trim() || undefined,
    }
    return this.adminOrganizationsService.listOrganizations(filters, cursor || undefined, safeLimit)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 400, description: 'Depth exceeded' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async createOrganization(
    @Session() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(createOrgSchema)) body: CreateOrgDto
  ) {
    return this.adminOrganizationsService.createOrganization(body, session.user.id)
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Get organization detail with members and children' })
  @ApiResponse({ status: 200, description: 'Organization detail' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganizationDetail(@Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string) {
    return this.adminOrganizationsService.getOrganizationDetail(orgId)
  }

  @Patch(':orgId')
  @ApiOperation({ summary: 'Update organization (name, slug, parent)' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 400, description: 'Depth exceeded or cycle detected' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async updateOrganization(
    @Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string,
    @Session() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(updateOrgSchema)) body: UpdateOrgDto
  ) {
    return this.adminOrganizationsService.updateOrganization(orgId, body, session.user.id)
  }

  @Get(':orgId/roles')
  @ApiOperation({ summary: 'List available RBAC roles for an organization (#313)' })
  @ApiResponse({ status: 200, description: 'Roles list' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async listOrgRoles(@Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string) {
    // TODO: implement — delegates to adminOrganizationsService.listOrgRoles(orgId)
    return this.adminOrganizationsService.listOrgRoles(orgId)
  }

  @Patch(':orgId/members/:memberId/role')
  @ApiOperation({ summary: 'Change a member role within the organization (#313)' })
  @ApiResponse({ status: 200, description: 'Role changed' })
  @ApiResponse({ status: 400, description: 'Last owner constraint' })
  @ApiResponse({ status: 404, description: 'Member or role not found' })
  async changeMemberRole(
    @Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string,
    @Param('memberId', new ParseUUIDPipe({ version: '4' })) memberId: string,
    @Session() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(changeMemberRoleSchema)) body: ChangeMemberRoleDto
  ) {
    // TODO: implement — delegates to adminMembersService.changeMemberRole with last-owner guard
    return this.adminMembersService.changeMemberRole(memberId, orgId, body, session.user.id)
  }

  @Get(':orgId/deletion-impact')
  @ApiOperation({ summary: 'Preview deletion impact for an organization' })
  @ApiResponse({ status: 200, description: 'Deletion impact preview' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getDeletionImpact(@Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string) {
    return this.adminOrganizationsService.getDeletionImpact(orgId)
  }

  @Delete(':orgId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an organization' })
  @ApiResponse({ status: 204, description: 'Organization deleted' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async deleteOrganization(
    @Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string,
    @Session() session: AuthenticatedSession
  ) {
    await this.adminOrganizationsService.deleteOrganization(orgId, session.user.id)
  }

  @Post(':orgId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted organization' })
  @ApiResponse({ status: 200, description: 'Organization restored' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async restoreOrganization(
    @Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string,
    @Session() session: AuthenticatedSession
  ) {
    return this.adminOrganizationsService.restoreOrganization(orgId, session.user.id)
  }
}
