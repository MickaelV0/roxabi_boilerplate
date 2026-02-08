import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from './auth/decorators/allow-anonymous.js'

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): { status: string } {
    return { status: 'ok' }
  }
}
