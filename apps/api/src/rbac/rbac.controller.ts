import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Permissions } from '../auth/decorators/permissions.decorator.js'
import { Session } from '../auth/decorators/session.decorator.js'
import { PermissionService } from './permission.service.js'
import { RbacService } from './rbac.service.js'

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller('api/roles')
export class RbacController {
  constructor(
    private readonly rbacService: RbacService,
    private readonly permissionService: PermissionService
  ) {}

  @Get()
  @Permissions('roles:read')
  @ApiOperation({ summary: 'List roles for the current organization' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async listRoles() {
    // TODO: implement
    return this.rbacService.listRoles()
  }

  @Post()
  @Permissions('roles:write')
  @ApiOperation({ summary: 'Create a custom role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 409, description: 'Role slug already exists' })
  async createRole(@Body() _body: { name: string; description?: string; permissions: string[] }) {
    // TODO: implement — validate body with Zod, call service
  }

  @Patch(':id')
  @Permissions('roles:write')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(
    @Param('id') _id: string,
    @Body() _body: { name?: string; description?: string; permissions?: string[] }
  ) {
    // TODO: implement
  }

  @Delete(':id')
  @Permissions('roles:delete')
  @ApiOperation({ summary: 'Delete a custom role (members fallback to Viewer)' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(@Param('id') _id: string) {
    // TODO: implement
  }

  @Get(':id/permissions')
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async getRolePermissions(@Param('id') _id: string) {
    // TODO: implement
    return this.rbacService.getRolePermissions(_id)
  }

  @Get('/permissions')
  @Permissions('roles:read')
  @ApiOperation({ summary: 'List all available permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions' })
  async listPermissions() {
    // TODO: implement
    return this.permissionService.getAllPermissions()
  }

  @Post('transfer-ownership')
  @ApiOperation({ summary: 'Transfer organization ownership to another Admin' })
  @ApiResponse({ status: 200, description: 'Ownership transferred' })
  @ApiResponse({ status: 400, description: 'Ownership constraint violated' })
  async transferOwnership(
    @Session() session: { user: { id: string } },
    @Body() _body: { targetMemberId: string }
  ) {
    // TODO: implement — Owner-only check (not just permission-based)
    return this.rbacService.transferOwnership(session.user.id, _body.targetMemberId)
  }

  @Patch('/members/:id/role')
  @Permissions('members:write')
  @ApiOperation({ summary: "Change a member's role" })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async changeMemberRole(@Param('id') _id: string, @Body() _body: { roleId: string }) {
    // TODO: implement
    return this.rbacService.changeMemberRole(_id, _body.roleId)
  }
}
