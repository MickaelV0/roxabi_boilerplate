import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { MemberNotFoundException } from '../../rbac/exceptions/member-not-found.exception.js'
import { RoleNotFoundException } from '../../rbac/exceptions/role-not-found.exception.js'
import { InvitationAlreadyPendingException } from '../exceptions/invitation-already-pending.exception.js'
import { LastOwnerConstraintException } from '../exceptions/last-owner-constraint.exception.js'
import { MemberAlreadyExistsException } from '../exceptions/member-already-exists.exception.js'
import { SelfRemovalException } from '../exceptions/self-removal.exception.js'

type AdminException =
  | MemberAlreadyExistsException
  | InvitationAlreadyPendingException
  | LastOwnerConstraintException
  | SelfRemovalException
  | MemberNotFoundException
  | RoleNotFoundException

@Catch(
  MemberAlreadyExistsException,
  InvitationAlreadyPendingException,
  LastOwnerConstraintException,
  SelfRemovalException,
  MemberNotFoundException,
  RoleNotFoundException
)
export class AdminExceptionFilter implements ExceptionFilter {
  constructor(private readonly cls: ClsService) {}

  catch(exception: AdminException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()
    const correlationId = this.cls.getId()

    let statusCode: number
    if (
      exception instanceof MemberNotFoundException ||
      exception instanceof RoleNotFoundException
    ) {
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
