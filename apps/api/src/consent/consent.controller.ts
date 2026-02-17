import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { OptionalAuth } from '../auth/decorators/optional-auth.js'
import { Session } from '../auth/decorators/session.decorator.js'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import { ConsentService } from './consent.service.js'

const consentCategoriesSchema = z.object({
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
})

const saveConsentSchema = z.object({
  categories: consentCategoriesSchema,
  policyVersion: z.string().min(1),
  action: z.enum(['accepted', 'rejected', 'customized']),
})

type SaveConsentDto = z.infer<typeof saveConsentSchema>

@ApiTags('Consent')
@Controller('api/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @OptionalAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Save user consent preferences' })
  @ApiResponse({ status: 201, description: 'Consent saved (authenticated user - DB + cookie)' })
  @ApiResponse({ status: 204, description: 'Consent saved (anonymous user - cookie only)' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  async saveConsent(
    @Session() session: { user: { id: string } } | null,
    @Body(new ZodValidationPipe(saveConsentSchema)) body: SaveConsentDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    // TODO: implement
    // - If session exists (authenticated): persist to DB via consentService.saveConsent() AND set cookie
    // - If no session (anonymous): set consent cookie only, return 204
    // - Cookie should contain: categories, consentedAt, policyVersion, action
    // - Extract ip_address from request, user_agent from headers for audit trail
    throw new Error('Not implemented')
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest consent record for authenticated user' })
  @ApiResponse({ status: 200, description: 'Latest consent record' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'No consent record found' })
  async getConsent(@Session() session: { user: { id: string } }) {
    // TODO: implement
    // - Call consentService.getLatestConsent(session.user.id)
    // - Return 404 if no record found
    throw new Error('Not implemented')
  }
}
