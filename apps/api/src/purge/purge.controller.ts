import { Controller, Headers, Post, UnauthorizedException } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from '../auth/decorators/allow-anonymous.js'
import { PurgeService } from './purge.service.js'

@ApiTags('Internal')
@Controller('api/internal')
export class PurgeController {
  constructor(private readonly purgeService: PurgeService) {}

  @Post('purge')
  @AllowAnonymous()
  @ApiOperation({ summary: 'GDPR purge cron — anonymize expired soft-deleted records' })
  @ApiResponse({ status: 200, description: 'Purge completed' })
  @ApiResponse({ status: 401, description: 'Invalid cron secret' })
  async purge(@Headers('authorization') authorization?: string) {
    // TODO: implement — validate CRON_SECRET from Authorization: Bearer header
    const cronSecret = process.env.CRON_SECRET
    const token = authorization?.replace('Bearer ', '')
    if (!cronSecret || token !== cronSecret) {
      throw new UnauthorizedException('Invalid cron secret')
    }

    // TODO: implement — call purgeService.runPurge()
    return this.purgeService.runPurge()
  }
}
