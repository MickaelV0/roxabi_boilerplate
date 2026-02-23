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
import { AdminUsersService } from './admin-users.service.js'
import { AdminExceptionFilter } from './filters/admin-exception.filter.js'

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
    // TODO: implement — parse and validate query params, call service
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user detail with memberships and activity' })
  @ApiResponse({ status: 200, description: 'User detail' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetail(@Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string) {
    // TODO: implement — call service getUserDetail
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user profile (name, email, role)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email conflict' })
  async updateUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession,
    @Body() body: unknown
  ) {
    // TODO: implement — Zod validation, call service updateUser
  }

  @Post(':userId/ban')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 200, description: 'User banned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession,
    @Body() body: unknown
  ) {
    // TODO: implement — Zod validation (reason 5-500 chars), call service banUser
  }

  @Post(':userId/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unbanUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession
  ) {
    // TODO: implement — call service unbanUser
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
    // TODO: implement — call service deleteUser
  }

  @Post(':userId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiResponse({ status: 200, description: 'User restored' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restoreUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Session() session: AuthenticatedSession
  ) {
    // TODO: implement — call service restoreUser
  }
}
