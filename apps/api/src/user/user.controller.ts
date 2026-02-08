import { Body, Controller, Get, Patch, UnauthorizedException } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Session } from '../auth/decorators/session.decorator.js'
import type { UserService } from './user.service.js'

@ApiTags('Users')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@Session() session: { user: { id: string } } | null) {
    if (!session) throw new UnauthorizedException()
    return this.userService.getProfile(session.user.id)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated user profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async updateMe(
    @Session() session: { user: { id: string } } | null,
    @Body() body: { name?: string; image?: string }
  ) {
    if (!session) throw new UnauthorizedException()
    return this.userService.updateProfile(session.user.id, body)
  }
}
