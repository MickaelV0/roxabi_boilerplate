import { Controller, Get, Query, UseFilters } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { SkipOrg } from '../common/decorators/skip-org.decorator.js'
import { AdminAuditLogsService } from './admin-audit-logs.service.js'
import { AdminExceptionFilter } from './filters/admin-exception.filter.js'

@ApiTags('Admin Audit Logs')
@ApiBearerAuth()
@UseFilters(AdminExceptionFilter)
@Throttle({ global: { ttl: 60_000, limit: 30 } })
@Roles('superadmin')
@SkipOrg()
@Controller('api/admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly adminAuditLogsService: AdminAuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit log entries (cross-tenant, cursor-paginated)' })
  @ApiResponse({ status: 200, description: 'Cursor-paginated audit log entries' })
  async listAuditLogs(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string
  ) {
    // TODO: implement — parse and validate query params, call service listAuditLogs
  }
}
