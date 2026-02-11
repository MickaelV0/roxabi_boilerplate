import { describe, it, vi } from 'vitest'
import type { TenantService } from '../tenant/tenant.service.js'
import { RbacService } from './rbac.service.js'

const mockTenantService: TenantService = {
  query: vi.fn(),
  queryAs: vi.fn(),
} as unknown as TenantService

describe('RbacService', () => {
  const _service = new RbacService(mockTenantService)

  describe('listRoles', () => {
    it('should list roles for current tenant', async () => {
      // TODO: implement test — mock TenantService.query() to return roles
    })
  })

  describe('createRole', () => {
    it('should create a custom role with permissions', async () => {
      // TODO: implement test
    })

    it('should reject duplicate slug within same tenant', async () => {
      // TODO: implement test
    })
  })

  describe('deleteRole', () => {
    it('should delete a custom role and fallback members to Viewer', async () => {
      // TODO: implement test
    })

    it('should reject deleting a default role', async () => {
      // TODO: implement test
    })
  })

  describe('transferOwnership', () => {
    it('should transfer ownership from Owner to Admin', async () => {
      // TODO: implement test
    })

    it('should reject transfer to non-Admin member', async () => {
      // TODO: implement test
    })

    it('should maintain at-least-one-Owner constraint', async () => {
      // TODO: implement test
    })
  })

  describe('changeMemberRole', () => {
    it('should change a member role', async () => {
      // TODO: implement test
    })

    it('should block removing last Owner', async () => {
      // TODO: implement test
    })
  })

  describe('seedDefaultRoles', () => {
    it('should seed Owner, Admin, Member, Viewer roles with permissions', async () => {
      // TODO: implement test
    })
  })
})
