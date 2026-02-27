import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { AUTH_SENSITIVE_PATHS, type ThrottlerMeta } from '../../throttler/index.js'
import { ErrorCode } from '../errorCodes.js'

function hasMessage(body: unknown): body is { message: string | string[] } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    (typeof (body as Record<string, unknown>).message === 'string' ||
      Array.isArray((body as Record<string, unknown>).message))
  )
}

function hasErrorCode(value: unknown): value is { errorCode: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'errorCode' in value &&
    typeof (value as Record<string, unknown>).errorCode === 'string'
  )
}

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  constructor(private readonly cls: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    const correlationId = this.cls.getId()

    // Handle ThrottlerException specifically
    if (exception instanceof ThrottlerException) {
      this.handleThrottlerException(exception, request, response, correlationId)
      return
    }

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    let message: string | string[]
    if (exception instanceof HttpException) {
      const body = exception.getResponse()
      if (typeof body === 'string') {
        message = body
      } else if (hasMessage(body)) {
        message = body.message
      } else {
        message = HttpStatus[status] || 'Error'
      }
    } else {
      message = 'Internal server error'
    }

    const errorCode = hasErrorCode(exception) ? exception.errorCode : undefined

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message,
      ...(errorCode !== undefined && { errorCode }),
    }

    this.logException(exception, request, correlationId, status)

    response.header('x-correlation-id', correlationId)
    response.status(status).send(errorResponse)
  }

  private logException(
    exception: unknown,
    request: FastifyRequest,
    correlationId: string,
    status: number
  ) {
    const label = `[${correlationId}] ${request.method} ${request.url} - ${status}`
    if (status >= 500) {
      this.logger.error(label, exception instanceof Error ? exception.stack : undefined)
    } else {
      this.logger.warn(label)
    }
  }

  private handleThrottlerException(
    exception: ThrottlerException,
    request: FastifyRequest,
    response: FastifyReply,
    correlationId: string
  ) {
    const status = exception.getStatus()
    // biome-ignore lint/suspicious/noExplicitAny: FastifyRequest does not declare throttlerMeta property
    const meta = (request as Record<string, any>).throttlerMeta as ThrottlerMeta | undefined

    const retryAfterSeconds = meta ? Math.max(1, meta.reset - Math.floor(Date.now() / 1000)) : 60

    // Set rate limit headers on 429 responses
    response.header('Retry-After', String(retryAfterSeconds))

    // Suppress X-RateLimit-* headers for auth-sensitive paths to avoid leaking rate limit state
    const path = request.url?.split('?')[0]
    const isAuthSensitive = AUTH_SENSITIVE_PATHS.some(
      (p) => path === p || path?.startsWith(`${p}/`)
    )
    if (meta && !isAuthSensitive) {
      response.header('X-RateLimit-Limit', String(meta.limit))
      response.header('X-RateLimit-Remaining', '0')
      response.header('X-RateLimit-Reset', String(meta.reset))
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: 'Too Many Requests',
      errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
    }

    // Log at warn level (not error) with structured context
    const tracker = meta?.tracker ?? 'unknown'
    const tierName = meta?.tierName ?? 'unknown'
    this.logger.warn(
      `[${correlationId}] RATE_LIMIT tracker=${tracker} path=${request.url} tier=${tierName}`
    )

    response.header('x-correlation-id', correlationId)
    response.status(status).send(errorResponse)
  }
}
