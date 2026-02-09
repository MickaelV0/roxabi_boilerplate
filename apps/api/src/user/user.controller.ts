import { Body, Controller, Get, Patch, UsePipes } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { Session } from '../auth/decorators/session.decorator.js'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import type { UserService } from './user.service.js'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
})

type UpdateProfileDto = z.infer<typeof updateProfileSchema>

@ApiTags('Users')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@Session() session: { user: { id: string } }) {
    return this.userService.getProfile(session.user.id)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated user profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  async updateMe(@Session() session: { user: { id: string } }, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(session.user.id, body)
  }
}
