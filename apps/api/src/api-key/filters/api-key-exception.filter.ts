import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { ApiKeyExpiryInPastException } from '../exceptions/api-key-expiry-in-past.exception.js'
import { ApiKeyNotFoundException } from '../exceptions/api-key-not-found.exception.js'
import { ApiKeyScopesExceededException } from '../exceptions/api-key-scopes-exceeded.exception.js'

type ApiKeyException =
  | ApiKeyNotFoundException
  | ApiKeyScopesExceededException
  | ApiKeyExpiryInPastException

@Catch(ApiKeyNotFoundException, ApiKeyScopesExceededException, ApiKeyExpiryInPastException)
export class ApiKeyExceptionFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: ApiKeyException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    let statusCode: number
    if (exception instanceof ApiKeyNotFoundException) {
      statusCode = HttpStatus.NOT_FOUND
    } else {
      statusCode = HttpStatus.BAD_REQUEST
    }

    response.header('x-correlation-id', correlationId)
    response.status(statusCode).send({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: exception.message,
      errorCode: exception.errorCode,
    })
  }
}
