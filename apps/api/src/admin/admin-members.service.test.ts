import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditService } from '../audit/audit.service.js'
import { MemberNotFoundException } from '../rbac/exceptions/member-not-found.exception.js'
import { RoleNotFoundException } from '../rbac/exceptions/role-not-found.exception.js'
import { AdminMembersService } from './admin-members.service.js'
import { InvitationAlreadyPendingException } from './exceptions/invitation-already-pending.exception.js'
import { LastOwnerConstraintException } from './exceptions/last-owner-constraint.exception.js'
import { MemberAlreadyExistsException } from './exceptions/member-already-exists.exception.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a chainable mock that mimics Drizzle's query-builder API.
 * Every builder method returns the same proxy so chains like
 * `.select().from().innerJoin().where().limit()` resolve correctly.
 *
 * The final awaited value is controlled by `result`.
 */
function createChainMock(result: unknown = []) {
  const chain: Record<string, unknown> = {}
  const methods = [
    'select',
    'from',
    'innerJoin',
    'leftJoin',
    'where',
    'orderBy',
    'limit',
    'offset',
    'insert',
    'values',
    'returning',
    'update',
    'set',
    'delete',
  ]
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  // Make the chain thenable so `await db.select()...` resolves to `result`
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for Drizzle chain
  chain.then = (resolve: (v: unknown) => void) => resolve(result)
  return chain
}

function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

function createMockAuditService(): AuditService {
  return { log: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService
}

/**
 * Instantiate the service with fresh mocks.
 * Returns the service and its mock collaborators so tests can configure
 * per-call return values.
 */
function createService() {
  const db = createMockDb()
  const auditService = createMockAuditService()
  const service = new AdminMembersService(db as never, auditService)
  return { service, db, auditService }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminMembersService', () => {
  let service: AdminMembersService
  let db: ReturnType<typeof createMockDb>
  let auditService: AuditService

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, db, auditService } = createService())
  })

  // -----------------------------------------------------------------------
  // listMembers
  // -----------------------------------------------------------------------
  describe('listMembers', () => {
    it('should return paginated member data with user and role details', async () => {
      // Arrange
      const orgId = 'org-1'
      const memberRow = {
        id: 'm-1',
        userId: 'u-1',
        role: 'admin',
        roleId: 'r-1',
        createdAt: new Date('2025-01-01'),
        userName: 'Alice',
        userEmail: 'alice@example.com',
        userImage: 'https://img.example.com/alice.png',
        roleName: 'Admin',
        roleSlug: 'admin',
      }
      const memberChain = createChainMock([memberRow])
      const countChain = createChainMock([{ count: 1 }])

      // The service calls db.select() twice via Promise.all:
      //   1) member rows query
      //   2) count query
      db.select.mockReturnValueOnce(memberChain).mockReturnValueOnce(countChain)

      // Act
      const result = await service.listMembers(orgId, { page: 1, limit: 20 })

      // Assert
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual({
        id: 'm-1',
        userId: 'u-1',
        role: 'admin',
        roleId: 'r-1',
        createdAt: new Date('2025-01-01'),
        user: {
          name: 'Alice',
          email: 'alice@example.com',
          image: 'https://img.example.com/alice.png',
        },
        roleDetails: { name: 'Admin', slug: 'admin' },
      })
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('should return null roleDetails when role is not joined', async () => {
      // Arrange
      const memberRow = {
        id: 'm-2',
        userId: 'u-2',
        role: 'member',
        roleId: null,
        createdAt: new Date('2025-06-01'),
        userName: 'Bob',
        userEmail: 'bob@example.com',
        userImage: null,
        roleName: null,
        roleSlug: null,
      }
      db.select
        .mockReturnValueOnce(createChainMock([memberRow]))
        .mockReturnValueOnce(createChainMock([{ count: 1 }]))

      // Act
      const result = await service.listMembers('org-1', { page: 1, limit: 20 })

      // Assert
      expect(result.data[0]?.roleDetails).toBeNull()
    })

    it('should handle empty results when no members exist', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([{ count: 0 }]))

      // Act
      const result = await service.listMembers('org-1', { page: 1, limit: 20 })

      // Assert
      expect(result.data).toEqual([])
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })

    it('should calculate correct offset from page and limit', async () => {
      // Arrange
      const memberChain = createChainMock([])
      const countChain = createChainMock([{ count: 0 }])
      db.select.mockReturnValueOnce(memberChain).mockReturnValueOnce(countChain)

      // Act
      await service.listMembers('org-1', { page: 3, limit: 10 })

      // Assert — offset should be (3-1)*10 = 20
      expect(memberChain.offset).toHaveBeenCalledWith(20)
    })
  })

  // -----------------------------------------------------------------------
  // inviteMember
  // -----------------------------------------------------------------------
  describe('inviteMember', () => {
    it('should create invitation when role exists and no conflicts', async () => {
      // Arrange
      const roleChain = createChainMock([{ id: 'r-member', slug: 'member' }])
      const existingMemberChain = createChainMock([])
      const existingInvitationChain = createChainMock([])
      const invitation = {
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
        status: 'pending',
      }
      const insertChain = createChainMock([invitation])

      db.select
        .mockReturnValueOnce(roleChain) // role lookup
        .mockReturnValueOnce(existingMemberChain) // existing member check
        .mockReturnValueOnce(existingInvitationChain) // existing invitation check
      db.insert.mockReturnValueOnce(insertChain)

      // Act
      const result = await service.inviteMember(
        'org-1',
        { email: 'new@example.com', roleId: 'r-member' },
        'actor-1'
      )

      // Assert
      expect(result).toEqual(invitation)
      expect(db.insert).toHaveBeenCalled()
    })

    it('should throw RoleNotFoundException when role does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(
        service.inviteMember('org-1', { email: 'new@example.com', roleId: 'r-invalid' }, 'actor-1')
      ).rejects.toThrow(RoleNotFoundException)
    })

    it('should throw MemberAlreadyExistsException when member already in org', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }])) // role exists
        .mockReturnValueOnce(createChainMock([{ id: 'm-existing' }])) // member exists

      // Act & Assert
      await expect(
        service.inviteMember(
          'org-1',
          { email: 'existing@example.com', roleId: 'r-member' },
          'actor-1'
        )
      ).rejects.toThrow(MemberAlreadyExistsException)
    })

    it('should throw InvitationAlreadyPendingException when pending invitation exists', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }])) // role exists
        .mockReturnValueOnce(createChainMock([])) // no existing member
        .mockReturnValueOnce(createChainMock([{ id: 'inv-existing' }])) // pending invitation

      // Act & Assert
      await expect(
        service.inviteMember(
          'org-1',
          { email: 'pending@example.com', roleId: 'r-member' },
          'actor-1'
        )
      ).rejects.toThrow(InvitationAlreadyPendingException)
    })

    it('should use empty string as resourceId when insert returns no rows', async () => {
      // Arrange — insert returns empty array so `invitation` is undefined
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }]))
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([]))
      db.insert.mockReturnValueOnce(createChainMock([]))

      // Act
      await service.inviteMember(
        'org-1',
        { email: 'new@example.com', roleId: 'r-member' },
        'actor-1'
      )

      // Assert — resourceId falls back to ''
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ resourceId: '' }))
    })

    it('should call auditService.log after creating invitation', async () => {
      // Arrange
      const invitation = {
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
        status: 'pending',
      }
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }]))
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([]))
      db.insert.mockReturnValueOnce(createChainMock([invitation]))

      // Act
      await service.inviteMember(
        'org-1',
        { email: 'new@example.com', roleId: 'r-member' },
        'actor-1'
      )

      // Assert
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'actor-1',
        actorType: 'user',
        organizationId: 'org-1',
        action: 'member.invited',
        resource: 'invitation',
        resourceId: 'inv-1',
        after: {
          email: 'new@example.com',
          roleId: 'r-member',
          roleSlug: 'member',
        },
      })
    })
  })

  // -----------------------------------------------------------------------
  // changeMemberRole
  // -----------------------------------------------------------------------
  describe('changeMemberRole', () => {
    it('should update role and legacy role field successfully', async () => {
      // Arrange
      const newRole = { id: 'r-admin', slug: 'admin', name: 'Admin' }
      const member = { id: 'm-1', userId: 'u-1', role: 'member', roleId: 'r-member' }
      const currentRole = { slug: 'member', name: 'Member' }

      db.select
        .mockReturnValueOnce(createChainMock([newRole])) // target role
        .mockReturnValueOnce(createChainMock([member])) // member lookup
        .mockReturnValueOnce(createChainMock([currentRole])) // current role for audit
      db.update.mockReturnValueOnce(createChainMock(undefined))

      // Act
      const result = await service.changeMemberRole(
        'm-1',
        'org-1',
        { roleId: 'r-admin' },
        'actor-1'
      )

      // Assert
      expect(result).toEqual({ updated: true })
      expect(db.update).toHaveBeenCalled()
    })

    it('should throw RoleNotFoundException when target role does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(
        service.changeMemberRole('m-1', 'org-1', { roleId: 'r-invalid' }, 'actor-1')
      ).rejects.toThrow(RoleNotFoundException)
    })

    it('should throw MemberNotFoundException when member not found', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-admin', slug: 'admin', name: 'Admin' }]))
        .mockReturnValueOnce(createChainMock([])) // member not found

      // Act & Assert
      await expect(
        service.changeMemberRole('m-missing', 'org-1', { roleId: 'r-admin' }, 'actor-1')
      ).rejects.toThrow(MemberNotFoundException)
    })

    it('should call auditService.log with before and after snapshots', async () => {
      // Arrange
      const newRole = { id: 'r-admin', slug: 'admin', name: 'Admin' }
      const member = { id: 'm-1', userId: 'u-1', role: 'member', roleId: 'r-member' }
      const currentRole = { slug: 'member', name: 'Member' }

      db.select
        .mockReturnValueOnce(createChainMock([newRole]))
        .mockReturnValueOnce(createChainMock([member]))
        .mockReturnValueOnce(createChainMock([currentRole]))
      db.update.mockReturnValueOnce(createChainMock(undefined))

      // Act
      await service.changeMemberRole('m-1', 'org-1', { roleId: 'r-admin' }, 'actor-1')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'actor-1',
        actorType: 'user',
        organizationId: 'org-1',
        action: 'member.role_changed',
        resource: 'member',
        resourceId: 'm-1',
        before: {
          roleId: 'r-member',
          roleSlug: 'member',
          roleName: 'Member',
        },
        after: {
          roleId: 'r-admin',
          roleSlug: 'admin',
          roleName: 'Admin',
        },
      })
    })

    it('should set null before role info when current role lookup returns empty', async () => {
      // Arrange — member has roleId but the role row is missing from DB
      const newRole = { id: 'r-admin', slug: 'admin', name: 'Admin' }
      const member = { id: 'm-1', userId: 'u-1', role: 'member', roleId: 'r-deleted' }

      db.select
        .mockReturnValueOnce(createChainMock([newRole]))
        .mockReturnValueOnce(createChainMock([member]))
        .mockReturnValueOnce(createChainMock([])) // role lookup returns nothing
      db.update.mockReturnValueOnce(createChainMock(undefined))

      // Act
      await service.changeMemberRole('m-1', 'org-1', { roleId: 'r-admin' }, 'actor-1')

      // Assert — before role slug/name fall back to null via ?? operator
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          before: {
            roleId: 'r-deleted',
            roleSlug: null,
            roleName: null,
          },
        })
      )
    })

    it('should set null before role info when member has no current roleId', async () => {
      // Arrange
      const newRole = { id: 'r-admin', slug: 'admin', name: 'Admin' }
      const member = { id: 'm-1', userId: 'u-1', role: 'member', roleId: null }

      db.select
        .mockReturnValueOnce(createChainMock([newRole]))
        .mockReturnValueOnce(createChainMock([member]))
      // no current role query since roleId is null
      db.update.mockReturnValueOnce(createChainMock(undefined))

      // Act
      await service.changeMemberRole('m-1', 'org-1', { roleId: 'r-admin' }, 'actor-1')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          before: {
            roleId: null,
            roleSlug: null,
            roleName: null,
          },
        })
      )
    })
  })

  // -----------------------------------------------------------------------
  // removeMember
  // -----------------------------------------------------------------------
  describe('removeMember', () => {
    it('should remove member successfully when not last owner', async () => {
      // Arrange
      const member = { id: 'm-1', userId: 'u-1', role: 'admin', roleId: 'r-admin' }
      const currentRole = { slug: 'admin' } // not owner

      db.select
        .mockReturnValueOnce(createChainMock([member])) // member lookup
        .mockReturnValueOnce(createChainMock([currentRole])) // role lookup
      db.delete.mockReturnValueOnce(createChainMock(undefined))

      // Act
      const result = await service.removeMember('m-1', 'org-1', 'actor-1')

      // Assert
      expect(result).toEqual({ removed: true })
      expect(db.delete).toHaveBeenCalled()
    })

    it('should remove member successfully when member has no roleId', async () => {
      // Arrange
      const member = { id: 'm-1', userId: 'u-1', role: 'member', roleId: null }

      db.select.mockReturnValueOnce(createChainMock([member]))
      db.delete.mockReturnValueOnce(createChainMock(undefined))

      // Act
      const result = await service.removeMember('m-1', 'org-1', 'actor-1')

      // Assert
      expect(result).toEqual({ removed: true })
    })

    it('should throw MemberNotFoundException when member not found', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(service.removeMember('m-missing', 'org-1', 'actor-1')).rejects.toThrow(
        MemberNotFoundException
      )
    })

    it('should throw LastOwnerConstraintException when removing last owner', async () => {
      // Arrange
      const member = { id: 'm-1', userId: 'u-1', role: 'owner', roleId: 'r-owner' }
      const currentRole = { slug: 'owner' }
      const ownerCount = { count: 1 }

      db.select
        .mockReturnValueOnce(createChainMock([member])) // member lookup
        .mockReturnValueOnce(createChainMock([currentRole])) // role is owner
        .mockReturnValueOnce(createChainMock([ownerCount])) // only 1 owner

      // Act & Assert
      await expect(service.removeMember('m-1', 'org-1', 'actor-1')).rejects.toThrow(
        LastOwnerConstraintException
      )
    })

    it('should throw LastOwnerConstraintException when owner count query returns empty', async () => {
      // Arrange — count query returns [] so ownerCount is undefined → fallback 0 <= 1
      const member = { id: 'm-1', userId: 'u-1', role: 'owner', roleId: 'r-owner' }
      const currentRole = { slug: 'owner' }

      db.select
        .mockReturnValueOnce(createChainMock([member]))
        .mockReturnValueOnce(createChainMock([currentRole]))
        .mockReturnValueOnce(createChainMock([])) // empty count result

      // Act & Assert
      await expect(service.removeMember('m-1', 'org-1', 'actor-1')).rejects.toThrow(
        LastOwnerConstraintException
      )
    })

    it('should allow removing owner when other owners exist', async () => {
      // Arrange
      const member = { id: 'm-1', userId: 'u-1', role: 'owner', roleId: 'r-owner' }
      const currentRole = { slug: 'owner' }
      const ownerCount = { count: 3 }

      db.select
        .mockReturnValueOnce(createChainMock([member]))
        .mockReturnValueOnce(createChainMock([currentRole]))
        .mockReturnValueOnce(createChainMock([ownerCount]))
      db.delete.mockReturnValueOnce(createChainMock(undefined))

      // Act
      const result = await service.removeMember('m-1', 'org-1', 'actor-1')

      // Assert
      expect(result).toEqual({ removed: true })
    })

    it('should call auditService.log after removal', async () => {
      // Arrange
      const member = { id: 'm-1', userId: 'u-1', role: 'admin', roleId: 'r-admin' }
      const currentRole = { slug: 'admin' }

      db.select
        .mockReturnValueOnce(createChainMock([member]))
        .mockReturnValueOnce(createChainMock([currentRole]))
      db.delete.mockReturnValueOnce(createChainMock(undefined))

      // Act
      await service.removeMember('m-1', 'org-1', 'actor-1')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'actor-1',
        actorType: 'user',
        organizationId: 'org-1',
        action: 'member.removed',
        resource: 'member',
        resourceId: 'm-1',
        before: {
          userId: 'u-1',
          role: 'admin',
          roleId: 'r-admin',
        },
      })
    })
  })
})
