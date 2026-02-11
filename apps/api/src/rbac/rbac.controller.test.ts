import { describe, expect, it, vi } from 'vitest'
import type { PermissionService } from './permission.service.js'
import { RbacController } from './rbac.controller.js'
import type { RbacService } from './rbac.service.js'

const mockRbacService: RbacService = {
  listRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  getRolePermissions: vi.fn(),
  transferOwnership: vi.fn(),
  changeMemberRole: vi.fn(),
  seedDefaultRoles: vi.fn(),
} as unknown as RbacService

const mockPermissionService: PermissionService = {
  getPermissions: vi.fn(),
  hasPermission: vi.fn(),
  getAllPermissions: vi.fn(),
} as unknown as PermissionService

describe('RbacController', () => {
  const controller = new RbacController(mockRbacService, mockPermissionService)

  describe('listRoles', () => {
    it('should call rbacService.listRoles', async () => {
      // TODO: implement test
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([])
      const result = await controller.listRoles()
      expect(result).toEqual([])
      expect(mockRbacService.listRoles).toHaveBeenCalled()
    })
  })

  describe('getRolePermissions', () => {
    it('should call rbacService.getRolePermissions with role id', async () => {
      // TODO: implement test
      vi.mocked(mockRbacService.getRolePermissions).mockResolvedValue([])
      const result = await controller.getRolePermissions('role-1')
      expect(result).toEqual([])
      expect(mockRbacService.getRolePermissions).toHaveBeenCalledWith('role-1')
    })
  })

  describe('listPermissions', () => {
    it('should call permissionService.getAllPermissions', async () => {
      // TODO: implement test
      vi.mocked(mockPermissionService.getAllPermissions).mockResolvedValue([])
      const result = await controller.listPermissions()
      expect(result).toEqual([])
      expect(mockPermissionService.getAllPermissions).toHaveBeenCalled()
    })
  })

  describe('transferOwnership', () => {
    it('should call rbacService.transferOwnership with correct args', async () => {
      // TODO: implement test
      const session = { user: { id: 'user-1' } }
      const body = { targetMemberId: 'member-2' }
      await controller.transferOwnership(session, body)
      expect(mockRbacService.transferOwnership).toHaveBeenCalledWith('user-1', 'member-2')
    })
  })
})
