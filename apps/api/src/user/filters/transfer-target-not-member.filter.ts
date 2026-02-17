import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { TransferTargetNotMemberException } from '../exceptions/transfer-target-not-member.exception.js'

@Catch(TransferTargetNotMemberException)
export class TransferTargetNotMemberFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(_exception: TransferTargetNotMemberException, host: ArgumentsHost) {
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
      message: 'Transfer target is not a member of the organization',
      errorCode: TransferTargetNotMemberException.errorCode,
    })
  }
}
