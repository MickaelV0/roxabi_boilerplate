import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { DefaultRoleException } from '../exceptions/defaultRole.exception.js'
import { MemberNotFoundException } from '../exceptions/memberNotFound.exception.js'
import { OwnershipConstraintException } from '../exceptions/ownershipConstraint.exception.js'
import { RoleNotFoundException } from '../exceptions/roleNotFound.exception.js'
import { RoleSlugConflictException } from '../exceptions/roleSlugConflict.exception.js'

type RbacException =
  | RoleNotFoundException
  | OwnershipConstraintException
  | DefaultRoleException
  | RoleSlugConflictException
  | MemberNotFoundException

@Catch(
  RoleNotFoundException,
  OwnershipConstraintException,
  DefaultRoleException,
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
      errorCode: exception.errorCode,
    })
  }
}
