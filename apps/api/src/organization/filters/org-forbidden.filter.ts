import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { OrgNameConfirmationMismatchException } from '../exceptions/org-name-confirmation-mismatch.exception.js'
import { OrgNotDeletedException } from '../exceptions/org-not-deleted.exception.js'
import { OrgNotOwnerException } from '../exceptions/org-not-owner.exception.js'

@Catch(OrgNotOwnerException)
export class OrgNotOwnerFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: OrgNotOwnerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    response.header('x-correlation-id', correlationId)
    response.status(HttpStatus.FORBIDDEN).send({
      statusCode: HttpStatus.FORBIDDEN,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: exception.message,
      errorCode: exception.errorCode,
    })
  }
}

@Catch(OrgNameConfirmationMismatchException)
export class OrgNameConfirmationMismatchFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: OrgNameConfirmationMismatchException, host: ArgumentsHost) {
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
      message: exception.message,
      errorCode: exception.errorCode,
    })
  }
}

@Catch(OrgNotDeletedException)
export class OrgNotDeletedFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: OrgNotDeletedException, host: ArgumentsHost) {
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
      message: exception.message,
      errorCode: exception.errorCode,
    })
  }
}
