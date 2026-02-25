import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { AllowAnonymous } from './auth/decorators/allowAnonymous.js'

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @AllowAnonymous()
  @SkipThrottle()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): { status: string } {
    return { status: 'ok' }
  }
}
