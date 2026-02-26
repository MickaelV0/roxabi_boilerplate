import { Body, Controller, Delete, Get, Param, Patch, Post, UseFilters } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { z } from 'zod'
import { AuditService } from '../audit/audit.service.js'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { Session } from '../auth/decorators/session.decorator.js'
import type { AuthenticatedSession } from '../auth/types.js'
import { SkipOrg } from '../common/decorators/skipOrg.decorator.js'
import { ZodValidationPipe } from '../common/pipes/zodValidation.pipe.js'
import { FeatureFlagService } from '../feature-flags/featureFlags.service.js'
import { FlagKeyConflictException } from './exceptions/flagKeyConflict.exception.js'
import { FlagKeyInvalidException } from './exceptions/flagKeyInvalid.exception.js'
import { FlagNotFoundException } from './exceptions/flagNotFound.exception.js'
import { AdminExceptionFilter } from './filters/adminException.filter.js'

const FLAG_KEY_REGEX = /^[a-z0-9][a-z0-9_-]*$/

const createFlagSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).max(100).regex(FLAG_KEY_REGEX),
  description: z.string().optional(),
})

const updateFlagSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
})

@ApiTags('Admin Feature Flags')
@ApiBearerAuth()
@UseFilters(AdminExceptionFilter)
@Throttle({ global: { ttl: 60_000, limit: 30 } })
@Roles('superadmin')
@SkipOrg()
@Controller('api/admin/feature-flags')
export class AdminFeatureFlagsController {
  constructor(
    private readonly featureFlagService: FeatureFlagService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({ status: 200, description: 'List of feature flags' })
  async getAll() {
    return this.featureFlagService.getAll()
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature flag' })
  @ApiResponse({ status: 201, description: 'Feature flag created' })
  @ApiResponse({ status: 400, description: 'Invalid key format' })
  @ApiResponse({ status: 409, description: 'Key already exists' })
  async create(
    @Session() session: AuthenticatedSession,
    @Body(new ZodValidationPipe(createFlagSchema)) body: z.infer<typeof createFlagSchema>
  ) {
    if (!FLAG_KEY_REGEX.test(body.key)) {
      throw new FlagKeyInvalidException(body.key)
    }

    let result: NonNullable<Awaited<ReturnType<FeatureFlagService['create']>>>
    try {
      const row = await this.featureFlagService.create(body)
      if (!row) throw new Error('Failed to create feature flag')
      result = row
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as Record<string, unknown>).code === '23505'
      ) {
        throw new FlagKeyConflictException(body.key)
      }
      throw error
    }

    this.auditService.log({
      actorId: session.user.id,
      actorType: 'user',
      action: 'flag.created',
      resource: 'feature_flag',
      resourceId: result.id,
      after: result,
    })

    return result
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  async update(
    @Session() session: AuthenticatedSession,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateFlagSchema)) body: z.infer<typeof updateFlagSchema>
  ) {
    const allFlags = await this.featureFlagService.getAll()
    const before = allFlags.find((f) => f.id === id)
    if (!before) {
      throw new FlagNotFoundException(id)
    }

    const result = await this.featureFlagService.update(id, body)
    if (!result) {
      throw new FlagNotFoundException(id)
    }

    const action = 'enabled' in body ? 'flag.toggled' : 'flag.updated'

    this.auditService.log({
      actorId: session.user.id,
      actorType: 'user',
      action,
      resource: 'feature_flag',
      resourceId: id,
      before,
      after: result,
    })

    return result
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag deleted' })
  @ApiResponse({ status: 404, description: 'Feature flag not found' })
  async delete(@Session() session: AuthenticatedSession, @Param('id') id: string) {
    const allFlags = await this.featureFlagService.getAll()
    const existing = allFlags.find((f) => f.id === id)
    if (!existing) {
      throw new FlagNotFoundException(id)
    }

    await this.featureFlagService.delete(id)

    this.auditService.log({
      actorId: session.user.id,
      actorType: 'user',
      action: 'flag.deleted',
      resource: 'feature_flag',
      resourceId: id,
      before: existing,
    })

    return { success: true }
  }
}
