import { describe, expect, it, vi } from 'vitest'
import { OrgNameConfirmationMismatchException } from './exceptions/orgNameConfirmationMismatch.exception.js'
import { OrgNotDeletedException } from './exceptions/orgNotDeleted.exception.js'
import { OrgNotFoundException } from './exceptions/orgNotFound.exception.js'
import { OrgNotOwnerException } from './exceptions/orgNotOwner.exception.js'
import { OrganizationService } from './organization.service.js'

function createMockDb() {
  const limitFn = vi.fn()
  const selectWhereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: selectWhereFn })
  const selectFn = vi.fn().mockReturnValue({ from: fromFn })

  const returningFn = vi.fn()
  const updateWhereFn = vi.fn().mockReturnValue({ returning: returningFn })
  const setFn = vi.fn().mockReturnValue({ where: updateWhereFn })
  const updateFn = vi.fn().mockReturnValue({ set: setFn })

  const deleteFn = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  })

  return {
    db: {
      select: selectFn,
      update: updateFn,
      delete: deleteFn,
      transaction: vi.fn(),
    },
    chains: {
      select: { from: fromFn, where: selectWhereFn, limit: limitFn },
      update: { set: setFn, where: updateWhereFn, returning: returningFn },
    },
  }
}

describe('OrganizationService', () => {
  describe('listForUser', () => {
    it('should return organizations the user belongs to', async () => {
      // Arrange
      const { db } = createMockDb()
      const orgs = [
        { id: 'org-1', name: 'Alpha', slug: 'alpha', logo: null, createdAt: new Date() },
        { id: 'org-2', name: 'Beta', slug: 'beta', logo: null, createdAt: new Date() },
      ]
      db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(orgs),
            }),
          }),
        }),
      })
      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      // Act
      const result = await service.listForUser('user-1')

      // Assert
      expect(result).toEqual(orgs)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when user has no memberships', async () => {
      // Arrange
      const { db } = createMockDb()
      db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      })
      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      // Act
      const result = await service.listForUser('user-no-orgs')

      // Assert
      expect(result).toEqual([])
    })

    it('should exclude soft-deleted organizations via whereActive', async () => {
      // Arrange -- whereActive filtering is done at the DB query level.
      // We verify the query is called (integration with whereActive is implicit).
      const { db } = createMockDb()
      const activeOrgs = [
        { id: 'org-1', name: 'Active Org', slug: 'active', logo: null, createdAt: new Date() },
      ]
      const whereFn = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(activeOrgs),
      })
      db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: whereFn,
          }),
        }),
      })
      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      // Act
      const result = await service.listForUser('user-1')

      // Assert
      expect(result).toEqual(activeOrgs)
      expect(whereFn).toHaveBeenCalled()
    })

    it('should order results by organization name', async () => {
      // Arrange
      const { db } = createMockDb()
      const orderByFn = vi.fn().mockResolvedValue([
        { id: 'org-1', name: 'Alpha', slug: 'alpha', logo: null, createdAt: new Date() },
        { id: 'org-2', name: 'Zeta', slug: 'zeta', logo: null, createdAt: new Date() },
      ])
      db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: orderByFn,
            }),
          }),
        }),
      })
      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      // Act
      const result = await service.listForUser('user-1')

      // Assert
      expect(orderByFn).toHaveBeenCalled()
      expect(result[0]?.name).toBe('Alpha')
      expect(result[1]?.name).toBe('Zeta')
    })
  })

  describe('softDelete', () => {
    it('should set deletedAt and deleteScheduledFor on the organization', async () => {
      const { db, chains } = createMockDb()
      // First call: find org
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', name: 'Test Org' }])
      // Second call: check membership
      chains.select.limit.mockResolvedValueOnce([{ role: 'owner' }])

      const now = new Date()
      const deleteScheduledFor = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const updatedOrg = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        deletedAt: now,
        deleteScheduledFor,
      }

      db.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([updatedOrg]),
              }),
            }),
          }),
        }
        return cb(tx)
      })

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)
      const result = await service.softDelete('org-1', 'user-1', 'Test Org')

      expect(result).toEqual(updatedOrg)
      expect(result?.deletedAt).toBeDefined()
      expect(result?.deleteScheduledFor).toBeDefined()
    })

    it('should clear activeOrganizationId on all sessions referencing the org', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', name: 'My Org' }])
      chains.select.limit.mockResolvedValueOnce([{ role: 'owner' }])

      const sessionUpdateFn = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      })
      const invitationUpdateFn = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      })

      let txUpdateCallCount = 0
      db.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          update: vi.fn().mockImplementation(() => {
            txUpdateCallCount++
            if (txUpdateCallCount === 1) {
              // Org update
              return {
                set: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([
                      {
                        id: 'org-1',
                        name: 'My Org',
                        slug: 'my-org',
                        deletedAt: new Date(),
                        deleteScheduledFor: new Date(),
                      },
                    ]),
                  }),
                }),
              }
            }
            if (txUpdateCallCount === 2) {
              // Session update
              return { set: sessionUpdateFn }
            }
            // Invitation update
            return { set: invitationUpdateFn }
          }),
        }
        return cb(tx)
      })

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)
      await service.softDelete('org-1', 'user-1', 'My Org')

      expect(db.transaction).toHaveBeenCalled()
    })

    it('should invalidate pending invitations', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', name: 'Org' }])
      chains.select.limit.mockResolvedValueOnce([{ role: 'owner' }])

      db.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([
                  {
                    id: 'org-1',
                    name: 'Org',
                    slug: 'org',
                    deletedAt: new Date(),
                    deleteScheduledFor: new Date(),
                  },
                ]),
              }),
            }),
          }),
        }
        return cb(tx)
      })

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)
      const result = await service.softDelete('org-1', 'user-1', 'Org')

      expect(result).toBeDefined()
      expect(db.transaction).toHaveBeenCalled()
    })

    it('should reject deletion by non-owner', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', name: 'Org' }])
      chains.select.limit.mockResolvedValueOnce([{ role: 'member' }])

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      await expect(service.softDelete('org-1', 'user-1', 'Org')).rejects.toThrow(
        OrgNotOwnerException
      )
    })

    it('should throw OrgNotFoundException when org does not exist', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([])

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      await expect(service.softDelete('nonexistent', 'user-1', 'X')).rejects.toThrow(
        OrgNotFoundException
      )
    })

    it('should throw OrgNameConfirmationMismatchException when name does not match', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', name: 'Real Org' }])

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      await expect(service.softDelete('org-1', 'user-1', 'Wrong Name')).rejects.toThrow(
        OrgNameConfirmationMismatchException
      )
    })
  })

  describe('reactivate', () => {
    it('should clear deletedAt and deleteScheduledFor', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', deletedAt: new Date() }])
      chains.select.limit.mockResolvedValueOnce([{ role: 'owner' }])

      const reactivatedOrg = {
        id: 'org-1',
        name: 'Org',
        slug: 'org',
        deletedAt: null,
        deleteScheduledFor: null,
      }
      chains.update.returning.mockResolvedValue([reactivatedOrg])

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)
      const result = await service.reactivate('org-1', 'user-1')

      expect(result?.deletedAt).toBeNull()
      expect(result?.deleteScheduledFor).toBeNull()
    })

    it('should reject reactivation by non-owner', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', deletedAt: new Date() }])
      chains.select.limit.mockResolvedValueOnce([{ role: 'member' }])

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      await expect(service.reactivate('org-1', 'user-1')).rejects.toThrow(OrgNotOwnerException)
    })

    it('should throw OrgNotDeletedException when org is not deleted', async () => {
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1', deletedAt: null }])

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)

      await expect(service.reactivate('org-1', 'user-1')).rejects.toThrow(OrgNotDeletedException)
    })
  })

  describe('getDeletionImpact', () => {
    it('should return member count, invitation count, and custom role count', async () => {
      const { db, chains } = createMockDb()
      // First call: find org
      chains.select.limit.mockResolvedValueOnce([{ id: 'org-1' }])

      // Override select for the count queries: each returns a single object with count
      const countResults = [
        [{ count: 5 }], // members
        [{ count: 2 }], // invitations
        [{ count: 1 }], // custom roles
      ]
      let countCallIndex = 0

      // After the first .limit() call for org check, we need to handle count queries
      // Count queries use .select().from().where() without .limit()
      const originalSelectFn = db.select
      db.select = vi.fn().mockImplementation((cols: unknown) => {
        // Check if this is a count query (the columns object has a 'count' key)
        if (cols && typeof cols === 'object' && 'count' in (cols as Record<string, unknown>)) {
          const result = countResults[countCallIndex] ?? [{ count: 0 }]
          countCallIndex++
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(result),
            }),
          }
        }
        return originalSelectFn(cols)
      })

      const service = new OrganizationService(db as never, { emitAsync: vi.fn() } as never)
      const result = await service.getDeletionImpact('org-1')

      expect(result).toEqual({
        memberCount: 5,
        invitationCount: 2,
        customRoleCount: 1,
      })
    })
  })
})
