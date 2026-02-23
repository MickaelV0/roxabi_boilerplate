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
import { AdminUsersService } from './admin-users.service.js'
import { AdminExceptionFilter } from './filters/admin-exception.filter.js'

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin', 'superadmin']).optional(),
})

const banUserSchema = z.object({
  reason: z.string().min(5).max(500),
  expires: z.string().datetime().nullable().optional(),
})

type UpdateUserDto = z.infer<typeof updateUserSchema>
type BanUserDto = z.infer<typeof banUserSchema>

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseFilters(AdminExceptionFilter)
@Throttle({ global: { ttl: 60_000, limit: 30 } })
@Roles('superadmin')
@SkipOrg()
@Controller('api/admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all platform users (cross-tenant, cursor-paginated)' })
  @ApiResponse({ status: 200, description: 'Cursor-paginated list of users' })
  async listUsers(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('organizationId') organizationId?: string,
    @Query('search') search?: string
  ) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
    const filters = {
      role: role || undefined,
      status: status || undefined,
      organizationId: organizationId || undefined,
      search: search?.trim() || undefined,
    }
    return this.adminUsersService.listUsers(filters, cursor || undefined, safeLimit)
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user detail with memberships and activity' })
  @ApiResponse({ status: 200, description: 'User detail' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetail(@Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string) {
    return this.adminUsersService.getUserDetail(userId)
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user profile (name, email, role)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email conflict' })
  async updateUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserDto
  ) {
    return this.adminUsersService.updateUser(userId, body, session.user.id)
  }

  @Post(':userId/ban')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 200, description: 'User banned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(banUserSchema)) body: BanUserDto
  ) {
    const expires = body.expires ? new Date(body.expires) : null
    return this.adminUsersService.banUser(userId, body.reason, expires, session.user.id)
  }

  @Post(':userId/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unbanUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession
  ) {
    return this.adminUsersService.unbanUser(userId, session.user.id)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession
  ) {
    await this.adminUsersService.deleteUser(userId, session.user.id)
  }

  @Post(':userId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiResponse({ status: 200, description: 'User restored' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restoreUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession
  ) {
    return this.adminUsersService.restoreUser(userId, session.user.id)
  }
}
