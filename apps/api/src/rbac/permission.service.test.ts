import { describe, expect, it, vi } from 'vitest'
import { PermissionService } from './permission.service.js'

describe('PermissionService', () => {
  describe('getPermissions', () => {
    it('should resolve permissions for a user in an organization', async () => {
      const memberChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ roleId: 'role-1' }]),
      }
      const permChain = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { resource: 'roles', action: 'read' },
          { resource: 'members', action: 'write' },
        ]),
      }
      const db = {
        select: vi.fn().mockReturnValueOnce(memberChain).mockReturnValueOnce(permChain),
      }

      const service = new PermissionService(db as never)
      const result = await service.getPermissions('user-1', 'org-1')

      expect(result).toEqual(['roles:read', 'members:write'])
    })

    it('should return empty array when member has no role_id', async () => {
      const memberChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ roleId: null }]),
      }
      const db = { select: vi.fn().mockReturnValue(memberChain) }

      const service = new PermissionService(db as never)
      const result = await service.getPermissions('user-1', 'org-1')

      expect(result).toEqual([])
    })

    it('should return empty array when no member found', async () => {
      const memberChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      const db = { select: vi.fn().mockReturnValue(memberChain) }

      const service = new PermissionService(db as never)
      const result = await service.getPermissions('user-1', 'org-1')

      expect(result).toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      const db = {} as never
      const service = new PermissionService(db)
      vi.spyOn(service, 'getPermissions').mockResolvedValue(['roles:read', 'members:write'])

      const result = await service.hasPermission('user-1', 'org-1', 'roles:read')

      expect(result).toBe(true)
    })

    it('should return false when user lacks the permission', async () => {
      const db = {} as never
      const service = new PermissionService(db)
      vi.spyOn(service, 'getPermissions').mockResolvedValue(['roles:read'])

      const result = await service.hasPermission('user-1', 'org-1', 'roles:write')

      expect(result).toBe(false)
    })
  })

  describe('getAllPermissions', () => {
    it('should return all global permissions', async () => {
      const mockPerms = [
        { id: 'p-1', resource: 'roles', action: 'read', description: 'View roles' },
      ]
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue(mockPerms),
        }),
      }
      const service = new PermissionService(db as never)

      const result = await service.getAllPermissions()

      expect(result).toEqual(mockPerms)
    })
  })
})
