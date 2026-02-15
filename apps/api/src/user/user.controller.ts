import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { Session } from '../auth/decorators/session.decorator.js'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import { UserService } from './user.service.js'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
})

type UpdateProfileDto = z.infer<typeof updateProfileSchema>

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    // TODO: Extract a UserProfileDto class once shared DTOs are established
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', nullable: true },
        email: { type: 'string' },
        emailVerified: { type: 'boolean' },
        image: { type: 'string', nullable: true },
        role: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@Session() session: { user: { id: string } }) {
    return this.userService.getProfile(session.user.id)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Updated user profile',
    // TODO: Extract a UserProfileDto class once shared DTOs are established
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', nullable: true },
        email: { type: 'string' },
        emailVerified: { type: 'boolean' },
        image: { type: 'string', nullable: true },
        role: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async updateMe(
    @Session() session: { user: { id: string } },
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto
  ) {
    return this.userService.updateProfile(session.user.id, body)
  }
}
