import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { EmailConflictException } from '../exceptions/email-conflict.exception.js'
import { InvitationAlreadyPendingException } from '../exceptions/invitation-already-pending.exception.js'
import { InvitationNotFoundException } from '../exceptions/invitation-not-found.exception.js'
import { LastOwnerConstraintException } from '../exceptions/last-owner-constraint.exception.js'
import { MemberAlreadyExistsException } from '../exceptions/member-already-exists.exception.js'
import { AdminMemberNotFoundException } from '../exceptions/member-not-found.exception.js'
import { OrgCycleDetectedException } from '../exceptions/org-cycle-detected.exception.js'
import { OrgDepthExceededException } from '../exceptions/org-depth-exceeded.exception.js'
import { AdminOrgNotFoundException } from '../exceptions/org-not-found.exception.js'
import { OrgSlugConflictException } from '../exceptions/org-slug-conflict.exception.js'
import { AdminRoleNotFoundException } from '../exceptions/role-not-found.exception.js'
import { SelfRemovalException } from '../exceptions/self-removal.exception.js'
import { SelfRoleChangeException } from '../exceptions/self-role-change.exception.js'
import { UserAlreadyBannedException } from '../exceptions/user-already-banned.exception.js'
import { AdminUserNotFoundException } from '../exceptions/user-not-found.exception.js'

type AdminException =
  | MemberAlreadyExistsException
  | InvitationAlreadyPendingException
  | InvitationNotFoundException
  | LastOwnerConstraintException
  | SelfRemovalException
  | SelfRoleChangeException
  | AdminMemberNotFoundException
  | AdminRoleNotFoundException
  | AdminUserNotFoundException
  | UserAlreadyBannedException
  | EmailConflictException
  | AdminOrgNotFoundException
  | OrgSlugConflictException
  | OrgDepthExceededException
  | OrgCycleDetectedException

@Catch(
  MemberAlreadyExistsException,
  InvitationAlreadyPendingException,
  InvitationNotFoundException,
  LastOwnerConstraintException,
  SelfRemovalException,
  SelfRoleChangeException,
  AdminMemberNotFoundException,
  AdminRoleNotFoundException,
  AdminUserNotFoundException,
  UserAlreadyBannedException,
  EmailConflictException,
  AdminOrgNotFoundException,
  OrgSlugConflictException,
  OrgDepthExceededException,
  OrgCycleDetectedException
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
      exception instanceof AdminMemberNotFoundException ||
      exception instanceof AdminRoleNotFoundException ||
      exception instanceof InvitationNotFoundException ||
      exception instanceof AdminUserNotFoundException ||
      exception instanceof AdminOrgNotFoundException
    ) {
      statusCode = HttpStatus.NOT_FOUND
    } else if (
      exception instanceof MemberAlreadyExistsException ||
      exception instanceof InvitationAlreadyPendingException ||
      exception instanceof EmailConflictException ||
      exception instanceof OrgSlugConflictException
    ) {
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
