import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { UserNotFoundException } from '../exceptions/user-not-found.exception.js'

@Catch(UserNotFoundException)
export class UserNotFoundFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: UserNotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    response.header('x-correlation-id', correlationId)
    response.status(HttpStatus.NOT_FOUND).send({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: exception.message,
    })
  }
}
