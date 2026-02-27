import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsService } from 'nestjs-cls'
import { EmailConflictException } from '../exceptions/emailConflict.exception.js'
import { FlagKeyConflictException } from '../exceptions/flagKeyConflict.exception.js'
import { FlagKeyInvalidException } from '../exceptions/flagKeyInvalid.exception.js'
import { FlagNotFoundException } from '../exceptions/flagNotFound.exception.js'
import { InvitationAlreadyPendingException } from '../exceptions/invitationAlreadyPending.exception.js'
import { InvitationNotFoundException } from '../exceptions/invitationNotFound.exception.js'
import { LastOwnerConstraintException } from '../exceptions/lastOwnerConstraint.exception.js'
import { LastSuperadminException } from '../exceptions/lastSuperadmin.exception.js'
import { MemberAlreadyExistsException } from '../exceptions/memberAlreadyExists.exception.js'
import { AdminMemberNotFoundException } from '../exceptions/memberNotFound.exception.js'
import { OrgCycleDetectedException } from '../exceptions/orgCycleDetected.exception.js'
import { OrgDepthExceededException } from '../exceptions/orgDepthExceeded.exception.js'
import { AdminOrgNotFoundException } from '../exceptions/orgNotFound.exception.js'
import { OrgSlugConflictException } from '../exceptions/orgSlugConflict.exception.js'
import { AdminRoleNotFoundException } from '../exceptions/roleNotFound.exception.js'
import { SelfActionException } from '../exceptions/selfAction.exception.js'
import { SelfRemovalException } from '../exceptions/selfRemoval.exception.js'
import { SelfRoleChangeException } from '../exceptions/selfRoleChange.exception.js'
import { SettingNotFoundException } from '../exceptions/settingNotFound.exception.js'
import { SettingValidationException } from '../exceptions/settingValidation.exception.js'
import { UserAlreadyBannedException } from '../exceptions/userAlreadyBanned.exception.js'
import { AdminUserNotFoundException } from '../exceptions/userNotFound.exception.js'

type AdminException =
  | MemberAlreadyExistsException
  | InvitationAlreadyPendingException
  | InvitationNotFoundException
  | LastOwnerConstraintException
  | LastSuperadminException
  | SelfRemovalException
  | SelfRoleChangeException
  | SelfActionException
  | AdminMemberNotFoundException
  | AdminRoleNotFoundException
  | AdminUserNotFoundException
  | UserAlreadyBannedException
  | EmailConflictException
  | AdminOrgNotFoundException
  | OrgSlugConflictException
  | OrgDepthExceededException
  | OrgCycleDetectedException
  | SettingNotFoundException
  | SettingValidationException
  | FlagNotFoundException
  | FlagKeyConflictException
  | FlagKeyInvalidException

@Catch(
  MemberAlreadyExistsException,
  InvitationAlreadyPendingException,
  InvitationNotFoundException,
  LastOwnerConstraintException,
  LastSuperadminException,
  SelfRemovalException,
  SelfRoleChangeException,
  SelfActionException,
  AdminMemberNotFoundException,
  AdminRoleNotFoundException,
  AdminUserNotFoundException,
  UserAlreadyBannedException,
  EmailConflictException,
  AdminOrgNotFoundException,
  OrgSlugConflictException,
  OrgDepthExceededException,
  OrgCycleDetectedException,
  SettingNotFoundException,
  SettingValidationException,
  FlagNotFoundException,
  FlagKeyConflictException,
  FlagKeyInvalidException
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
      exception instanceof AdminOrgNotFoundException ||
      exception instanceof SettingNotFoundException ||
      exception instanceof FlagNotFoundException
    ) {
      statusCode = HttpStatus.NOT_FOUND
    } else if (
      exception instanceof MemberAlreadyExistsException ||
      exception instanceof InvitationAlreadyPendingException ||
      exception instanceof EmailConflictException ||
      exception instanceof OrgSlugConflictException ||
      exception instanceof FlagKeyConflictException
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
