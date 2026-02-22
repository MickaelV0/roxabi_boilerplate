import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { Permissions } from '../auth/decorators/permissions.decorator.js'
import { Session } from '../auth/decorators/session.decorator.js'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import { AdminMembersService } from './admin-members.service.js'

const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
})

const changeMemberRoleSchema = z.object({
  roleId: z.string().uuid(),
})

type InviteMemberDto = z.infer<typeof inviteMemberSchema>
type ChangeMemberRoleDto = z.infer<typeof changeMemberRoleSchema>

@ApiTags('Admin Members')
@ApiBearerAuth()
@Controller('api/admin/members')
export class AdminMembersController {
  constructor(private readonly adminMembersService: AdminMembersService) {}

  @Get()
  @Permissions('members:read')
  @ApiOperation({ summary: 'List members for the current organization' })
  @ApiResponse({ status: 200, description: 'Paginated list of members' })
  async listMembers(
    @Session()
    session: { session: { activeOrganizationId: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    return this.adminMembersService.listMembers(session.session.activeOrganizationId, {
      page,
      limit,
    })
  }

  @Post('invite')
  @Permissions('members:write')
  @ApiOperation({ summary: 'Invite a new member to the organization' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  @ApiResponse({ status: 400, description: 'Member already exists or invitation pending' })
  async inviteMember(
    @Session()
    session: { user: { id: string }; session: { activeOrganizationId: string } },
    @Body(new ZodValidationPipe(inviteMemberSchema)) body: InviteMemberDto
  ) {
    return this.adminMembersService.inviteMember(
      session.session.activeOrganizationId,
      body,
      session.user.id
    )
  }

  @Patch(':memberId')
  @Permissions('members:write')
  @ApiOperation({ summary: "Change a member's role" })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @ApiResponse({ status: 404, description: 'Member or role not found' })
  async changeMemberRole(
    @Param('memberId', new ParseUUIDPipe({ version: '4' })) memberId: string,
    @Session()
    session: { user: { id: string }; session: { activeOrganizationId: string } },
    @Body(new ZodValidationPipe(changeMemberRoleSchema)) body: ChangeMemberRoleDto
  ) {
    return this.adminMembersService.changeMemberRole(
      memberId,
      session.session.activeOrganizationId,
      body,
      session.user.id
    )
  }

  @Delete(':memberId')
  @Permissions('members:delete')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove the last owner' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeMember(
    @Param('memberId', new ParseUUIDPipe({ version: '4' })) memberId: string,
    @Session()
    session: { user: { id: string }; session: { activeOrganizationId: string } }
  ) {
    return this.adminMembersService.removeMember(
      memberId,
      session.session.activeOrganizationId,
      session.user.id
    )
  }
}
