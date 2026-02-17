import { Controller, Get, Header, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'
import { Session } from '../auth/decorators/session.decorator.js'
import { GdprService } from './gdpr.service.js'

@ApiTags('GDPR')
@ApiBearerAuth()
@Controller('api/gdpr')
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all user data (GDPR data portability)' })
  @ApiResponse({ status: 200, description: 'JSON file download with all user data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @Header('Content-Type', 'application/json')
  async exportUserData(
    @Session() session: { user: { id: string } },
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    // TODO: implement
    // - Call gdprService.exportUserData(session.user.id)
    // - Set Content-Disposition header for file download: attachment; filename="gdpr-export-{userId}-{timestamp}.json"
    // - Must be allowed for soft-deleted users (ensure query does not filter by deleted_at)
    // - Return the export data as JSON
    throw new Error('Not implemented')
  }
}
