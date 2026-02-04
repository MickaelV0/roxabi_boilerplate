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

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    const correlationId = request.headers['x-correlation-id'] || 'unknown'

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    let message: string | string[]
    if (exception instanceof HttpException) {
      const body = exception.getResponse()
      if (typeof body === 'string') {
        message = body
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        message = (body as { message: string | string[] }).message
      } else {
        message = HttpStatus[status] || 'Error'
      }
    } else {
      message = 'Internal server error'
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message,
    }

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : undefined
    )

    response.status(status).send(errorResponse)
  }
}
