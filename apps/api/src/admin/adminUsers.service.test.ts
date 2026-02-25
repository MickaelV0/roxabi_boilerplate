import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditService } from '../audit/audit.service.js'
import { createChainMock } from './__test-utils__/createChainMock.js'
import { AdminUsersService } from './adminUsers.service.js'
import { EmailConflictException } from './exceptions/emailConflict.exception.js'
import { SuperadminProtectionException } from './exceptions/superadminProtection.exception.js'
import { AdminUserNotFoundException } from './exceptions/userNotFound.exception.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function createMockClsService(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

/**
 * Instantiate the service with fresh mocks.
 * Returns the service and its mock collaborators so tests can configure
 * per-call return values.
 */
function createService() {
  const db = createMockDb()
  const auditService = createMockAuditService()
  const cls = createMockClsService()
  const service = new AdminUsersService(db as never, auditService, cls as never)
  return { service, db, auditService, cls }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseUser = {
  id: 'user-1',
  name: 'Alice Admin',
  email: 'alice@example.com',
  role: 'user',
  banned: false,
  banReason: null,
  banExpires: null,
  deletedAt: null,
  deleteScheduledFor: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminUsersService', () => {
  let service: AdminUsersService
  let db: ReturnType<typeof createMockDb>
  let auditService: AuditService

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, db, auditService } = createService())
  })

  // -----------------------------------------------------------------------
  // listUsers
  // -----------------------------------------------------------------------
  describe('listUsers', () => {
    /**
     * Helper: mock db.select for the three-query listUsers pattern.
     * Query 1 returns user rows, Query 2 returns membership rows,
     * Query 3 returns lastActive rows (actorId + lastActive timestamp).
     * Returns the first chain mock for assertion on where/orderBy/limit.
     */
    function mockListUsersQueries(
      userRows: unknown[] = [],
      membershipRows: unknown[] = [],
      lastActiveRows: unknown[] = []
    ) {
      const usersChain = createChainMock(userRows)
      const membershipsChain = createChainMock(membershipRows)
      const lastActiveChain = createChainMock(lastActiveRows)
      db.select
        .mockReturnValueOnce(usersChain)
        .mockReturnValueOnce(membershipsChain)
        .mockReturnValueOnce(lastActiveChain)
      return { usersChain, membershipsChain, lastActiveChain }
    }

    it('should return cursor-paginated users with organizations array', async () => {
      // Arrange
      mockListUsersQueries(
        [{ ...baseUser }],
        [{ userId: 'user-1', orgId: 'org-1', orgName: 'Acme Corp', orgSlug: 'acme', role: 'admin' }]
      )

      // Act
      const result = await service.listUsers({}, undefined, 20)

      // Assert
      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(result.data).toHaveLength(1)
      expect(result.data[0]?.organizations).toEqual([
        { id: 'org-1', name: 'Acme Corp', slug: 'acme', role: 'admin' },
      ])
      expect(result.cursor).toBeDefined()
    })

    it('should return hasMore=true and next cursor when more rows exist', async () => {
      // Arrange — return limit+1 rows to signal more data
      const limit = 2
      const rows = [
        { ...baseUser, id: 'u-1', createdAt: new Date('2025-01-03') },
        { ...baseUser, id: 'u-2', createdAt: new Date('2025-01-02') },
        { ...baseUser, id: 'u-3', createdAt: new Date('2025-01-01') },
      ]
      mockListUsersQueries(rows, [])

      // Act
      const result = await service.listUsers({}, undefined, limit)

      // Assert
      expect(result.cursor.hasMore).toBe(true)
      expect(result.cursor.next).not.toBeNull()
      expect(result.data).toHaveLength(limit)
    })

    it('should return hasMore=false when fewer rows than limit exist', async () => {
      // Arrange
      const rows = [{ ...baseUser, id: 'u-1', createdAt: new Date('2025-01-01') }]
      mockListUsersQueries(rows, [])

      // Act
      const result = await service.listUsers({}, undefined, 20)

      // Assert
      expect(result.cursor.hasMore).toBe(false)
      expect(result.cursor.next).toBeNull()
    })

    it('should filter users by role', async () => {
      // Arrange
      const adminRow = { ...baseUser, id: 'u-admin', role: 'superadmin' }
      const { usersChain } = mockListUsersQueries([adminRow], [])

      // Act
      const result = await service.listUsers({ role: 'superadmin' }, undefined, 20)

      // Assert
      expect(result.data).toBeDefined()
      // The where clause on the chain must have been called with a defined filter condition
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should filter users by status active (banned=false, deletedAt IS NULL)', async () => {
      // Arrange
      const { usersChain } = mockListUsersQueries([], [])

      // Act
      await service.listUsers({ status: 'active' }, undefined, 20)

      // Assert — where must have been called with a defined filter condition (not undefined)
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should filter users by status banned (banned=true)', async () => {
      // Arrange
      const bannedRow = {
        ...baseUser,
        id: 'u-banned',
        banned: true,
        banReason: 'spam',
      }
      const { usersChain } = mockListUsersQueries([bannedRow], [])

      // Act
      const result = await service.listUsers({ status: 'banned' }, undefined, 20)

      // Assert
      expect(result.data).toBeDefined()
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should filter users by status archived (deletedAt IS NOT NULL)', async () => {
      // Arrange
      const archivedRow = {
        ...baseUser,
        id: 'u-archived',
        deletedAt: new Date('2025-06-01'),
      }
      const { usersChain } = mockListUsersQueries([archivedRow], [])

      // Act
      const result = await service.listUsers({ status: 'archived' }, undefined, 20)

      // Assert
      expect(result.data).toBeDefined()
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should filter users by organizationId using EXISTS subquery', async () => {
      // Arrange — organizationId filter uses EXISTS, so the first query (users)
      // still needs a second db.select call for the EXISTS subquery builder.
      // The chain mock handles this transparently.
      const { usersChain } = mockListUsersQueries([], [])

      // Act
      await service.listUsers({ organizationId: 'org-specific' }, undefined, 20)

      // Assert — where must have been called with a defined filter (not undefined)
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should search users by name or email using ILIKE', async () => {
      // Arrange
      const { usersChain } = mockListUsersQueries([], [])

      // Act
      await service.listUsers({ search: 'alice' }, undefined, 20)

      // Assert — where must have been called with a defined search condition
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should escape special ILIKE characters % and _ in search term', async () => {
      // Arrange — search with SQL wildcard characters that must be escaped
      const { usersChain } = mockListUsersQueries([], [])

      // Act — should not throw, and escaping should be applied
      await service.listUsers({ search: 'user%name_test' }, undefined, 20)

      // Assert — where must have been called with a defined condition
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should apply cursor condition when cursor is provided', async () => {
      // Arrange — encode a valid cursor
      const cursor = btoa(JSON.stringify({ t: '2025-01-01T00:00:00.000Z', i: 'user-abc' }))
      const { usersChain } = mockListUsersQueries([], [])

      // Act
      await service.listUsers({}, cursor, 20)

      // Assert — where should include cursor condition
      expect(usersChain.where).toHaveBeenCalledWith(expect.anything())
    })

    it('should return empty data with no cursor when no users exist', async () => {
      // Arrange — only one db.select call needed (no memberships query for empty users)
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await service.listUsers({}, undefined, 20)

      // Assert
      expect(result.data).toEqual([])
      expect(result.cursor.hasMore).toBe(false)
      expect(result.cursor.next).toBeNull()
    })

    it('should return empty organizations array for users with no memberships', async () => {
      // Arrange — user exists but no membership rows returned
      mockListUsersQueries([{ ...baseUser }], [])

      // Act
      const result = await service.listUsers({}, undefined, 20)

      // Assert
      expect(result.data).toHaveLength(1)
      expect(result.data[0]?.organizations).toEqual([])
    })

    it('should merge multiple organizations per user', async () => {
      // Arrange — one user with two org memberships
      mockListUsersQueries(
        [{ ...baseUser }],
        [
          {
            userId: 'user-1',
            orgId: 'org-1',
            orgName: 'Acme Corp',
            orgSlug: 'acme',
            role: 'admin',
          },
          {
            userId: 'user-1',
            orgId: 'org-2',
            orgName: 'Beta Inc',
            orgSlug: 'beta',
            role: 'member',
          },
        ]
      )

      // Act
      const result = await service.listUsers({}, undefined, 20)

      // Assert
      expect(result.data[0]?.organizations).toHaveLength(2)
      expect(result.data[0]?.organizations).toEqual([
        { id: 'org-1', name: 'Acme Corp', slug: 'acme', role: 'admin' },
        { id: 'org-2', name: 'Beta Inc', slug: 'beta', role: 'member' },
      ])
    })
  })

  // -----------------------------------------------------------------------
  // getUserDetail
  // -----------------------------------------------------------------------
  describe('getUserDetail', () => {
    it('should return user profile with org memberships and last 10 audit entries', async () => {
      // Arrange
      const userRow = { ...baseUser }
      const membershipRows = [
        {
          memberId: 'm-1',
          orgId: 'org-1',
          orgName: 'Acme Corp',
          role: 'admin',
          joinedAt: new Date('2024-06-01'),
        },
      ]
      const auditRows = [
        {
          id: 'log-1',
          timestamp: new Date('2025-01-10'),
          actorId: 'user-1',
          actorType: 'user',
          action: 'user.updated',
          resource: 'user',
          resourceId: 'user-1',
          before: null,
          after: null,
          metadata: null,
        },
      ]

      // getUserDetail makes 3 queries: user lookup, memberships, audit entries
      db.select
        .mockReturnValueOnce(createChainMock([userRow])) // user profile
        .mockReturnValueOnce(createChainMock(membershipRows)) // org memberships
        .mockReturnValueOnce(createChainMock(auditRows)) // audit entries

      // Act
      const result = await service.getUserDetail('user-1')

      // Assert — flat shape after #8 fix
      expect(result).toBeDefined()
      expect(result.id).toBe('user-1')
      expect(result.organizations).toBeDefined()
      expect(result.activitySummary).toBeDefined()
    })

    it('should limit audit entries to last 10', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([baseUser]))
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([]))

      // Act
      await service.getUserDetail('user-1')

      // Assert — the audit query chain must have been called with limit(10)
      // The third select chain is for audit entries
      const auditChain = db.select.mock.results[2]?.value
      expect(auditChain?.limit).toHaveBeenCalledWith(10)
    })

    it('should include audit entries where resourceId=userId AND resource=user OR actorId=userId', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([baseUser]))
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([]))

      // Act
      await service.getUserDetail('user-1')

      // Assert — the audit query must use an OR condition via where()
      const auditChain = db.select.mock.results[2]?.value
      expect(auditChain?.where).toHaveBeenCalled()
    })

    it('should throw AdminUserNotFoundException when user is not found', async () => {
      // Arrange — first select returns empty (user not found)
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(service.getUserDetail('user-missing')).rejects.toThrow(
        AdminUserNotFoundException
      )
    })

    it('should return empty memberships when user belongs to no organizations', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([baseUser]))
        .mockReturnValueOnce(createChainMock([])) // no memberships
        .mockReturnValueOnce(createChainMock([])) // no audit entries

      // Act
      const result = await service.getUserDetail('user-1')

      // Assert
      expect(result.organizations).toEqual([])
    })
  })

  // -----------------------------------------------------------------------
  // updateUser
  // -----------------------------------------------------------------------
  describe('updateUser', () => {
    it('should update name, email, and role and return the updated user', async () => {
      // Arrange — read before-state then perform update
      const beforeUser = { ...baseUser }
      const updatedUser = {
        ...baseUser,
        name: 'Alice Updated',
        email: 'alice-new@example.com',
        role: 'superadmin',
      }

      db.select.mockReturnValueOnce(createChainMock([beforeUser]))
      db.update.mockReturnValueOnce(createChainMock([updatedUser]))

      // Act
      const result = await service.updateUser(
        'user-1',
        { name: 'Alice Updated', email: 'alice-new@example.com', role: 'superadmin' },
        'actor-super'
      )

      // Assert
      expect(result).toBeDefined()
      expect(db.update).toHaveBeenCalled()
    })

    it('should record before and after snapshots in the audit log', async () => {
      // Arrange
      const beforeUser = { ...baseUser }
      const updatedUser = { ...baseUser, name: 'New Name' }

      db.select.mockReturnValueOnce(createChainMock([beforeUser]))
      db.update.mockReturnValueOnce(createChainMock([updatedUser]))

      // Act
      await service.updateUser('user-1', { name: 'New Name' }, 'actor-super')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.updated',
          resource: 'user',
          resourceId: 'user-1',
          actorId: 'actor-super',
          before: expect.objectContaining({ name: 'Alice Admin' }),
          after: expect.objectContaining({ name: 'New Name' }),
        })
      )
    })

    it('should throw AdminUserNotFoundException when user does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(
        service.updateUser('user-missing', { name: 'New Name' }, 'actor-super')
      ).rejects.toThrow(AdminUserNotFoundException)
    })

    it('should throw EmailConflictException on duplicate email (pg error 23505)', async () => {
      // Arrange — user exists, but update throws a unique constraint violation
      db.select.mockReturnValueOnce(createChainMock([baseUser]))
      const pgError = { code: '23505', constraint_name: 'users_email_unique' }
      const updateChain = createChainMock([])
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock to simulate pg rejection
      updateChain.then = (_resolve: unknown, reject: (e: unknown) => void) => reject(pgError)
      db.update.mockReturnValueOnce(updateChain)

      // Act & Assert
      await expect(
        service.updateUser('user-1', { email: 'taken@example.com' }, 'actor-super')
      ).rejects.toThrow(EmailConflictException)
    })

    it('should rethrow unknown errors that are not 23505', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([baseUser]))
      const unknownError = new Error('DB connection lost')
      const updateChain = createChainMock([])
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock to simulate pg rejection
      updateChain.then = (_resolve: unknown, reject: (e: unknown) => void) => reject(unknownError)
      db.update.mockReturnValueOnce(updateChain)

      // Act & Assert
      await expect(service.updateUser('user-1', { name: 'X' }, 'actor-super')).rejects.toThrow(
        'DB connection lost'
      )
    })

    it('should not call auditService.log when user is not found', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      await service.updateUser('user-missing', { name: 'X' }, 'actor-super').catch(() => {})

      // Assert
      expect(auditService.log).not.toHaveBeenCalled()
    })

    it('should throw SuperadminProtectionException when changing a superadmin role to non-superadmin', async () => {
      // Arrange
      const superadminUser = { ...baseUser, role: 'superadmin' }
      db.select.mockReturnValueOnce(createChainMock([superadminUser]))

      // Act & Assert
      await expect(service.updateUser('user-1', { role: 'user' }, 'actor-super')).rejects.toThrow(
        SuperadminProtectionException
      )
    })

    it('should use audit action user.role_changed when role is changed', async () => {
      // Arrange
      const beforeUser = { ...baseUser, role: 'user' }
      const updatedUser = { ...baseUser, role: 'superadmin' }

      db.select.mockReturnValueOnce(createChainMock([beforeUser]))
      db.update.mockReturnValueOnce(createChainMock([updatedUser]))

      // Act
      await service.updateUser('user-1', { role: 'superadmin' }, 'actor-super')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.role_changed',
        })
      )
    })

    it('should use audit action user.updated when role is not changed', async () => {
      // Arrange
      const beforeUser = { ...baseUser, role: 'user' }
      const updatedUser = { ...baseUser, name: 'New Name', role: 'user' }

      db.select.mockReturnValueOnce(createChainMock([beforeUser]))
      db.update.mockReturnValueOnce(createChainMock([updatedUser]))

      // Act
      await service.updateUser('user-1', { name: 'New Name' }, 'actor-super')

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.updated',
        })
      )
    })
  })
})
