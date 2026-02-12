import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { MemberNotFoundException } from '../exceptions/member-not-found.exception.js'
import { OwnershipConstraintException } from '../exceptions/ownership-constraint.exception.js'
import { RoleNotFoundException } from '../exceptions/role-not-found.exception.js'
import { RoleSlugConflictException } from '../exceptions/role-slug-conflict.exception.js'

type RbacException =
  | RoleNotFoundException
  | OwnershipConstraintException
  | RoleSlugConflictException
  | MemberNotFoundException

@Catch(
  RoleNotFoundException,
  OwnershipConstraintException,
  RoleSlugConflictException,
  MemberNotFoundException
)
export class RbacExceptionFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: RbacException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    let statusCode: number
    if (
      exception instanceof RoleNotFoundException ||
      exception instanceof MemberNotFoundException
    ) {
      statusCode = HttpStatus.NOT_FOUND
    } else if (exception instanceof RoleSlugConflictException) {
      statusCode = HttpStatus.CONFLICT
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
    })
  }
}
