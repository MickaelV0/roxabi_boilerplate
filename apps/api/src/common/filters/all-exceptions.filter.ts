import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'

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

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : undefined
    )

    response.header('x-correlation-id', correlationId)
    response.status(status).send(errorResponse)
  }
}
