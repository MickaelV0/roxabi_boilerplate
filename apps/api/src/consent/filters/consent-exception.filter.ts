import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { ConsentInsertFailedException } from '../exceptions/consent-insert-failed.exception.js'
import { ConsentNotFoundException } from '../exceptions/consent-not-found.exception.js'

type ConsentException = ConsentNotFoundException | ConsentInsertFailedException

@Catch(ConsentNotFoundException, ConsentInsertFailedException)
export class ConsentExceptionFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: ConsentException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    let statusCode: number
    if (exception instanceof ConsentNotFoundException) {
      statusCode = HttpStatus.NOT_FOUND
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR
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
