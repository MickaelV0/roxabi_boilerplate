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
import { Roles } from '../auth/decorators/roles.decorator.js'
import { Session } from '../auth/decorators/session.decorator.js'
import type { AuthenticatedSession } from '../auth/types.js'
import { SkipOrg } from '../common/decorators/skip-org.decorator.js'
import { AdminOrganizationsService } from './admin-organizations.service.js'
import { AdminExceptionFilter } from './filters/admin-exception.filter.js'

@ApiTags('Admin Organizations')
@ApiBearerAuth()
@UseFilters(AdminExceptionFilter)
@Throttle({ global: { ttl: 60_000, limit: 30 } })
@Roles('superadmin')
@SkipOrg()
@Controller('api/admin/organizations')
export class AdminOrganizationsController {
  constructor(private readonly adminOrganizationsService: AdminOrganizationsService) {}

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
    // TODO: implement — if view=tree, call listOrganizationsForTree; else flat list
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 400, description: 'Depth exceeded' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async createOrganization(@Session() session: AuthenticatedSession, @Body() body: unknown) {
    // TODO: implement — Zod validation (name, slug, parentOrganizationId), call service
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Get organization detail with members and children' })
  @ApiResponse({ status: 200, description: 'Organization detail' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganizationDetail(@Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string) {
    // TODO: implement — call service getOrganizationDetail
  }

  @Patch(':orgId')
  @ApiOperation({ summary: 'Update organization (name, slug, parent)' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 400, description: 'Depth exceeded or cycle detected' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async updateOrganization(
    @Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string,
    @Session() session: AuthenticatedSession,
    @Body() body: unknown
  ) {
    // TODO: implement — Zod validation, call service updateOrganization
  }

  @Get(':orgId/deletion-impact')
  @ApiOperation({ summary: 'Preview deletion impact for an organization' })
  @ApiResponse({ status: 200, description: 'Deletion impact preview' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getDeletionImpact(@Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string) {
    // TODO: implement — call service getDeletionImpact
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
    // TODO: implement — call service deleteOrganization
  }

  @Post(':orgId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted organization' })
  @ApiResponse({ status: 200, description: 'Organization restored' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async restoreOrganization(
    @Param('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string,
    @Session() session: AuthenticatedSession
  ) {
    // TODO: implement — call service restoreOrganization
  }
}
