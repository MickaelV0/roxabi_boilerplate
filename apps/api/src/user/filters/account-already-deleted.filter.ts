import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { AccountAlreadyDeletedException } from '../exceptions/account-already-deleted.exception.js'

@Catch(AccountAlreadyDeletedException)
export class AccountAlreadyDeletedFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(_exception: AccountAlreadyDeletedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    response.header('x-correlation-id', correlationId)
    response.status(HttpStatus.BAD_REQUEST).send({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: 'Account is already scheduled for deletion',
      errorCode: AccountAlreadyDeletedException.errorCode,
    })
  }
}
