import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { OwnershipConstraintException } from '../exceptions/ownership-constraint.exception.js'
import { RoleNotFoundException } from '../exceptions/role-not-found.exception.js'

@Catch(RoleNotFoundException, OwnershipConstraintException)
export class RbacExceptionFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: RoleNotFoundException | OwnershipConstraintException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    const statusCode =
      exception instanceof RoleNotFoundException ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST

    response.header('x-correlation-id', correlationId)
    response.status(statusCode).send({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: exception.message,
    })
  }
}
