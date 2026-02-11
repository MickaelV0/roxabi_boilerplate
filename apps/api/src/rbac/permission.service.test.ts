import { describe, it, vi } from 'vitest'
import type { DrizzleDB } from '../database/drizzle.provider.js'
import type { TenantService } from '../tenant/tenant.service.js'
import { PermissionService } from './permission.service.js'

const mockDb = {} as DrizzleDB

const mockTenantService: TenantService = {
  query: vi.fn(),
  queryAs: vi.fn(),
} as unknown as TenantService

describe('PermissionService', () => {
  const _service = new PermissionService(mockDb, mockTenantService)

  describe('getPermissions', () => {
    it('should resolve permissions for a user in an organization', async () => {
      // TODO: implement test
      // Mock member lookup → role_id → role_permissions join → permission strings
    })

    it('should return empty array when member has no role_id', async () => {
      // TODO: implement test
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      // TODO: implement test
    })

    it('should return false when user lacks the permission', async () => {
      // TODO: implement test
    })
  })

  describe('getAllPermissions', () => {
    it('should return all global permissions', async () => {
      // TODO: implement test
    })
  })
})
