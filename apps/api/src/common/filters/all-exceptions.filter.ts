import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    const correlationId = request.headers['x-correlation-id'] || 'unknown'

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error'

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message:
        typeof message === 'string'
          ? message
          : (message as { message?: string }).message || message,
    }

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : undefined
    )

    response.status(status).send(errorResponse)
  }
}
