import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RbacService } from '../../rbac/rbac.service.js'
import { V1RolesController } from './v1Roles.controller.js'

const mockRbacService: RbacService = {
  listRoles: vi.fn(),
  getRolePermissions: vi.fn(),
} as unknown as RbacService

describe('V1RolesController', () => {
  const controller = new V1RolesController(mockRbacService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('listRoles', () => {
    it('calls rbacService.listRoles and getRolePermissions for each role', async () => {
      // Arrange
      const roles = [
        { id: 'role-1', name: 'Admin', description: 'Administrator' },
        { id: 'role-2', name: 'Member', description: null },
      ]
      vi.mocked(mockRbacService.listRoles).mockResolvedValue(roles as never)
      vi.mocked(mockRbacService.getRolePermissions)
        .mockResolvedValueOnce([
          { resource: 'members', action: 'read' },
          { resource: 'members', action: 'write' },
        ] as never)
        .mockResolvedValueOnce([{ resource: 'members', action: 'read' }] as never)

      // Act
      await controller.listRoles()

      // Assert
      expect(mockRbacService.listRoles).toHaveBeenCalledOnce()
      expect(mockRbacService.getRolePermissions).toHaveBeenCalledWith('role-1')
      expect(mockRbacService.getRolePermissions).toHaveBeenCalledWith('role-2')
    })

    it('maps permissions to resource:action format', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([
        { id: 'role-1', name: 'Admin', description: 'Administrator' },
      ] as never)
      vi.mocked(mockRbacService.getRolePermissions).mockResolvedValue([
        { resource: 'members', action: 'read' },
        { resource: 'users', action: 'write' },
        { resource: 'roles', action: 'delete' },
      ] as never)

      // Act
      const result = await controller.listRoles()

      // Assert
      expect(result[0]!.permissions).toEqual(['members:read', 'users:write', 'roles:delete'])
    })

    it('returns V1RoleResponse[] with correct shape', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([
        { id: 'role-1', name: 'Admin', description: 'Administrator role' },
      ] as never)
      vi.mocked(mockRbacService.getRolePermissions).mockResolvedValue([
        { resource: 'members', action: 'read' },
      ] as never)

      // Act
      const result = await controller.listRoles()

      // Assert
      expect(result).toEqual([
        {
          id: 'role-1',
          name: 'Admin',
          description: 'Administrator role',
          permissions: ['members:read'],
        },
      ])
    })

    it('returns empty array when no roles exist', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([] as never)

      // Act
      const result = await controller.listRoles()

      // Assert
      expect(result).toEqual([])
    })

    it('handles role with null description', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([
        { id: 'role-1', name: 'Member', description: null },
      ] as never)
      vi.mocked(mockRbacService.getRolePermissions).mockResolvedValue([] as never)

      // Act
      const result = await controller.listRoles()

      // Assert
      expect(result[0]!.description).toBeNull()
    })

    it('handles role with no permissions', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([
        { id: 'role-1', name: 'Viewer', description: null },
      ] as never)
      vi.mocked(mockRbacService.getRolePermissions).mockResolvedValue([] as never)

      // Act
      const result = await controller.listRoles()

      // Assert
      expect(result[0]!.permissions).toEqual([])
    })

    it('processes multiple roles with their respective permissions', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([
        { id: 'r-1', name: 'Admin', description: null },
        { id: 'r-2', name: 'Member', description: null },
      ] as never)
      vi.mocked(mockRbacService.getRolePermissions)
        .mockResolvedValueOnce([{ resource: 'users', action: 'write' }] as never)
        .mockResolvedValueOnce([{ resource: 'users', action: 'read' }] as never)

      // Act
      const result = await controller.listRoles()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]!.permissions).toEqual(['users:write'])
      expect(result[1]!.permissions).toEqual(['users:read'])
    })

    it('propagates errors from rbacService.listRoles', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockRejectedValue(new Error('DB error'))

      // Act & Assert
      await expect(controller.listRoles()).rejects.toThrow('DB error')
    })

    it('propagates errors from rbacService.getRolePermissions', async () => {
      // Arrange
      vi.mocked(mockRbacService.listRoles).mockResolvedValue([
        { id: 'r-1', name: 'Admin', description: null },
      ] as never)
      vi.mocked(mockRbacService.getRolePermissions).mockRejectedValue(
        new Error('Permissions error')
      )

      // Act & Assert
      await expect(controller.listRoles()).rejects.toThrow('Permissions error')
    })
  })
})
