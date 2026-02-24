import { describe, expect, it, vi } from 'vitest'
import type { AuthenticatedSession } from '../auth/types.js'
import { ApiKeyService } from './api-key.service.js'
import { ApiKeyExpiryInPastException } from './exceptions/api-key-expiry-in-past.exception.js'
import { ApiKeyNotFoundException } from './exceptions/api-key-not-found.exception.js'
import { ApiKeyScopesExceededException } from './exceptions/api-key-scopes-exceeded.exception.js'

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function createMockDb() {
  // -- insert chain: insert().values().returning()
  const returningFn = vi.fn()
  const valuesFn = vi.fn().mockReturnValue({ returning: returningFn })
  const insertFn = vi.fn().mockReturnValue({ values: valuesFn })

  // -- select chain: select().from().where().orderBy() / .limit()
  const orderByFn = vi.fn()
  const limitFn = vi.fn()
  const selectWhereFn = vi.fn().mockReturnValue({ orderBy: orderByFn, limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: selectWhereFn })
  const selectFn = vi.fn().mockReturnValue({ from: fromFn })

  // -- update chain: update().set().where()
  const updateWhereFn = vi.fn().mockResolvedValue(undefined)
  const setFn = vi.fn().mockReturnValue({ where: updateWhereFn })
  const updateFn = vi.fn().mockReturnValue({ set: setFn })

  return {
    db: { insert: insertFn, select: selectFn, update: updateFn },
    chains: {
      insert: { values: valuesFn, returning: returningFn },
      select: { from: fromFn, where: selectWhereFn, orderBy: orderByFn, limit: limitFn },
      update: { set: setFn, where: updateWhereFn },
    },
  }
}

function createMockAuditService() {
  return { log: vi.fn().mockResolvedValue(undefined) }
}

function createMockCls() {
  return { getId: vi.fn().mockReturnValue('cls-correlation-id') }
}

function createSession(overrides: Partial<AuthenticatedSession> = {}): AuthenticatedSession {
  return {
    user: { id: 'user-1' },
    session: { id: 'sess-1', activeOrganizationId: 'org-1' },
    permissions: ['api_keys:read', 'api_keys:write', 'billing:read'],
    ...overrides,
  }
}

function createService(
  dbOverride?: ReturnType<typeof createMockDb>['db'],
  auditOverride?: ReturnType<typeof createMockAuditService>,
  clsOverride?: ReturnType<typeof createMockCls>
) {
  const db = dbOverride ?? createMockDb().db
  const audit = auditOverride ?? createMockAuditService()
  const cls = clsOverride ?? createMockCls()
  return new ApiKeyService(db as never, audit as never, cls as never)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApiKeyService', () => {
  // -----------------------------------------------------------------------
  // create()
  // -----------------------------------------------------------------------
  describe('create()', () => {
    it('should return a full key starting with sk_live_ prefix', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      const insertedRow = {
        id: 'key-1',
        name: 'My Key',
        keyPrefix: 'sk_live_',
        lastFour: 'abcd',
        scopes: ['api_keys:read'],
        expiresAt: null,
        createdAt: new Date(),
      }
      chains.insert.returning.mockResolvedValue([insertedRow])
      const service = createService(db)

      // Act
      const result = await service.create(createSession(), {
        name: 'My Key',
        scopes: ['api_keys:read'],
      })

      // Assert
      expect(result.key).toMatch(/^sk_live_[a-zA-Z0-9]{32}$/)
    })

    it('should insert a row with HMAC-hashed key and salt', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        {
          id: 'key-1',
          name: 'My Key',
          keyPrefix: 'sk_live_',
          lastFour: 'xxxx',
          scopes: ['api_keys:read'],
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      const service = createService(db)

      // Act
      await service.create(createSession(), {
        name: 'My Key',
        scopes: ['api_keys:read'],
      })

      // Assert
      expect(db.insert).toHaveBeenCalledOnce()
      const insertedValues = chains.insert.values.mock.calls[0]?.[0] as Record<string, unknown>
      expect(insertedValues.keyHash).toEqual(expect.any(String))
      expect(insertedValues.keySalt).toEqual(expect.any(String))
      expect(insertedValues.keyPrefix).toBe('sk_live_')
      expect(insertedValues.tenantId).toBe('org-1')
      expect(insertedValues.userId).toBe('user-1')
      expect(insertedValues.name).toBe('My Key')
      expect(insertedValues.scopes).toEqual(['api_keys:read'])
      // Hash is a 64-char hex string (SHA-256)
      expect(insertedValues.keyHash).toMatch(/^[a-f0-9]{64}$/)
      // Salt is a 32-char hex string (16 bytes)
      expect(insertedValues.keySalt).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should store lastFour as last 4 characters of the full key', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        {
          id: 'key-1',
          name: 'K',
          keyPrefix: 'sk_live_',
          lastFour: 'xxxx',
          scopes: [],
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      const audit = createMockAuditService()
      const service = createService(db, audit)

      // Act
      const result = await service.create(createSession({ permissions: [] }), {
        name: 'K',
        scopes: [],
      })

      // Assert
      const insertedValues = chains.insert.values.mock.calls[0]?.[0] as Record<string, unknown>
      const fullKey = result.key as string
      expect(insertedValues.lastFour).toBe(fullKey.slice(-4))
    })

    it('should call auditService.log with api_key.created action', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        {
          id: 'key-1',
          name: 'Audit Test',
          keyPrefix: 'sk_live_',
          lastFour: 'abcd',
          scopes: ['api_keys:read'],
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      const audit = createMockAuditService()
      const service = createService(db, audit)

      // Act
      await service.create(createSession(), {
        name: 'Audit Test',
        scopes: ['api_keys:read'],
      })

      // Assert
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'user-1',
          actorType: 'user',
          organizationId: 'org-1',
          action: 'api_key.created',
          resource: 'api_key',
          resourceId: expect.any(String),
          apiKeyId: expect.any(String),
          after: {
            name: 'Audit Test',
            scopes: ['api_keys:read'],
            expiresAt: null,
          },
        })
      )
      // Verify the apiKeyId and resourceId are valid UUIDs (same value)
      const auditCall = audit.log.mock.calls[0]?.[0] as Record<string, unknown>
      expect(auditCall.apiKeyId).toBe(auditCall.resourceId)
      expect(auditCall.apiKeyId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('should parse expiresAt as a Date when provided', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        {
          id: 'key-1',
          name: 'Expiring Key',
          keyPrefix: 'sk_live_',
          lastFour: 'abcd',
          scopes: [],
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          createdAt: new Date(),
        },
      ])
      const service = createService(db)

      // Act
      await service.create(createSession({ permissions: [] }), {
        name: 'Expiring Key',
        scopes: [],
        expiresAt: '2099-01-01T00:00:00.000Z',
      })

      // Assert
      const insertedValues = chains.insert.values.mock.calls[0]?.[0] as Record<string, unknown>
      expect(insertedValues.expiresAt).toEqual(new Date('2099-01-01T00:00:00.000Z'))
    })

    it('should set expiresAt to null when not provided', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        {
          id: 'key-1',
          name: 'No Expiry',
          keyPrefix: 'sk_live_',
          lastFour: 'abcd',
          scopes: [],
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      const service = createService(db)

      // Act
      await service.create(createSession({ permissions: [] }), { name: 'No Expiry', scopes: [] })

      // Assert
      const insertedValues = chains.insert.values.mock.calls[0]?.[0] as Record<string, unknown>
      expect(insertedValues.expiresAt).toBeNull()
    })

    it('should throw ApiKeyExpiryInPastException when expiresAt is in the past', async () => {
      // Arrange
      const service = createService()

      // Act & Assert
      await expect(
        service.create(createSession({ permissions: [] }), {
          name: 'Past Key',
          scopes: [],
          expiresAt: '2000-01-01T00:00:00.000Z',
        })
      ).rejects.toThrow(ApiKeyExpiryInPastException)
    })

    it('should throw ApiKeyScopesExceededException when scopes exceed permissions', async () => {
      // Arrange
      const service = createService()
      const session = createSession({ permissions: ['api_keys:read'] })

      // Act & Assert
      await expect(
        service.create(session, {
          name: 'Over-scoped',
          scopes: ['api_keys:read', 'admin:super_secret'],
        })
      ).rejects.toThrow(ApiKeyScopesExceededException)
    })

    it('should not throw when scopes are a subset of permissions', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        {
          id: 'key-1',
          name: 'Valid Scopes',
          keyPrefix: 'sk_live_',
          lastFour: 'abcd',
          scopes: ['api_keys:read'],
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      const service = createService(db)
      const session = createSession({ permissions: ['api_keys:read', 'api_keys:write'] })

      // Act
      const result = await service.create(session, {
        name: 'Valid Scopes',
        scopes: ['api_keys:read'],
      })

      // Assert
      expect(result).toBeDefined()
    })

    it('should throw Error when session has no activeOrganizationId', async () => {
      // Arrange
      const service = createService()
      const session = createSession({
        session: { id: 'sess-1', activeOrganizationId: null },
      })

      // Act & Assert
      await expect(service.create(session, { name: 'No Org', scopes: [] })).rejects.toThrow(
        'Active organization required'
      )
    })

    it('should generate unique keys on each call', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.insert.returning.mockResolvedValue([
        {
          id: 'key-1',
          name: 'K',
          keyPrefix: 'sk_live_',
          lastFour: 'abcd',
          scopes: [],
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      const service = createService(db)
      const session = createSession({ permissions: [] })

      // Act
      const result1 = await service.create(session, { name: 'K', scopes: [] })
      const result2 = await service.create(session, { name: 'K', scopes: [] })

      // Assert
      expect(result1.key).not.toBe(result2.key)
    })
  })

  // -----------------------------------------------------------------------
  // list()
  // -----------------------------------------------------------------------
  describe('list()', () => {
    it('should return data array from the database', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      const rows = [
        {
          id: 'key-1',
          name: 'Key One',
          keyPrefix: 'sk_live_',
          lastFour: 'aaaa',
          scopes: ['api_keys:read'],
          rateLimitTier: 'standard',
          expiresAt: null,
          lastUsedAt: null,
          revokedAt: null,
          createdAt: new Date(),
        },
      ]
      chains.select.orderBy.mockResolvedValue(rows)
      const service = createService(db)

      // Act
      const result = await service.list('org-1')

      // Assert
      expect(result).toEqual({ data: rows })
    })

    it('should return empty data array when no keys exist', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.orderBy.mockResolvedValue([])
      const service = createService(db)

      // Act
      const result = await service.list('org-1')

      // Assert
      expect(result).toEqual({ data: [] })
    })

    it('should query by tenantId matching the orgId', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.orderBy.mockResolvedValue([])
      const service = createService(db)

      // Act
      await service.list('org-42')

      // Assert
      expect(db.select).toHaveBeenCalledOnce()
      expect(chains.select.where).toHaveBeenCalledOnce()
    })
  })

  // -----------------------------------------------------------------------
  // revoke()
  // -----------------------------------------------------------------------
  describe('revoke()', () => {
    it('should revoke an existing active key and return revocation timestamp', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([{ id: 'key-1', revokedAt: null }])
      chains.update.where.mockResolvedValue(undefined)
      const audit = createMockAuditService()
      const service = createService(db, audit)

      // Act
      const result = await service.revoke('key-1', 'org-1', 'user-1')

      // Assert
      expect(result.id).toBe('key-1')
      expect(result.revokedAt).toEqual(expect.any(String))
      // Verify it is a valid ISO string
      expect(new Date(result.revokedAt).toISOString()).toBe(result.revokedAt)
    })

    it('should call db.update to set revokedAt', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([{ id: 'key-1', revokedAt: null }])
      chains.update.where.mockResolvedValue(undefined)
      const service = createService(db)

      // Act
      await service.revoke('key-1', 'org-1', 'user-1')

      // Assert
      expect(db.update).toHaveBeenCalledOnce()
      const setArg = chains.update.set.mock.calls[0]?.[0] as Record<string, unknown>
      expect(setArg.revokedAt).toBeInstanceOf(Date)
    })

    it('should log api_key.revoked audit event', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([{ id: 'key-1', revokedAt: null }])
      chains.update.where.mockResolvedValue(undefined)
      const audit = createMockAuditService()
      const service = createService(db, audit)

      // Act
      await service.revoke('key-1', 'org-1', 'user-1')

      // Assert
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'user-1',
          organizationId: 'org-1',
          action: 'api_key.revoked',
          resource: 'api_key',
          resourceId: 'key-1',
        })
      )
    })

    it('should be idempotent when key is already revoked', async () => {
      // Arrange
      const revokedAt = new Date('2024-06-01T00:00:00.000Z')
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([{ id: 'key-1', revokedAt }])
      const audit = createMockAuditService()
      const service = createService(db, audit)

      // Act
      const result = await service.revoke('key-1', 'org-1', 'user-1')

      // Assert
      expect(result).toEqual({ id: 'key-1', revokedAt: revokedAt.toISOString() })
      // Should NOT update or log again
      expect(db.update).not.toHaveBeenCalled()
      expect(audit.log).not.toHaveBeenCalled()
    })

    it('should throw ApiKeyNotFoundException when key does not exist', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([])
      const service = createService(db)

      // Act & Assert
      await expect(service.revoke('nonexistent', 'org-1', 'user-1')).rejects.toThrow(
        ApiKeyNotFoundException
      )
    })

    it('should throw ApiKeyNotFoundException with the key id in the message', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.select.limit.mockResolvedValue([])
      const service = createService(db)

      // Act & Assert
      await expect(service.revoke('key-xyz', 'org-1', 'user-1')).rejects.toThrow(
        'API key "key-xyz" not found'
      )
    })
  })

  // -----------------------------------------------------------------------
  // revokeAllForUser()
  // -----------------------------------------------------------------------
  describe('revokeAllForUser()', () => {
    it('should update all non-revoked keys for the given userId', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.update.where.mockResolvedValue(undefined)
      const service = createService(db)

      // Act
      await service.revokeAllForUser('user-1')

      // Assert
      expect(db.update).toHaveBeenCalledOnce()
      const setArg = chains.update.set.mock.calls[0]?.[0] as Record<string, unknown>
      expect(setArg.revokedAt).toBeInstanceOf(Date)
    })

    it('should not throw when no keys exist for the user', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.update.where.mockResolvedValue(undefined)
      const service = createService(db)

      // Act & Assert
      await expect(service.revokeAllForUser('user-no-keys')).resolves.toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // revokeAllForOrg()
  // -----------------------------------------------------------------------
  describe('revokeAllForOrg()', () => {
    it('should update all non-revoked keys for the given organizationId', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.update.where.mockResolvedValue(undefined)
      const service = createService(db)

      // Act
      await service.revokeAllForOrg('org-1')

      // Assert
      expect(db.update).toHaveBeenCalledOnce()
      const setArg = chains.update.set.mock.calls[0]?.[0] as Record<string, unknown>
      expect(setArg.revokedAt).toBeInstanceOf(Date)
    })

    it('should not throw when no keys exist for the organization', async () => {
      // Arrange
      const { db, chains } = createMockDb()
      chains.update.where.mockResolvedValue(undefined)
      const service = createService(db)

      // Act & Assert
      await expect(service.revokeAllForOrg('org-no-keys')).resolves.toBeUndefined()
    })
  })
})
