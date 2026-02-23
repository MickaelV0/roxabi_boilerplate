import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAuditLogsService } from './admin-audit-logs.service.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a chainable mock that mimics Drizzle's query-builder API.
 * Every builder method returns the same proxy so chains like
 * `.select().from().leftJoin().where().orderBy().limit()` resolve correctly.
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
  return { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() }
}

/**
 * Instantiate the service with fresh mocks.
 * Returns the service and its mock collaborators so tests can configure
 * per-call return values.
 */
function createService() {
  const db = createMockDb()
  const service = new AdminAuditLogsService(db as never)
  return { service, db }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseAuditEntry = {
  id: 'log-1',
  timestamp: new Date('2025-06-01T10:00:00.000Z'),
  actorId: 'user-1',
  actorType: 'user',
  actorName: 'Alice Admin',
  impersonatorId: null,
  organizationId: 'org-1',
  action: 'user.updated',
  resource: 'user',
  resourceId: 'user-target',
  before: { name: 'Old Name' },
  after: { name: 'New Name' },
  metadata: null,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminAuditLogsService', () => {
  let service: AdminAuditLogsService
  let db: ReturnType<typeof createMockDb>

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, db } = createService())
  })

  // -----------------------------------------------------------------------
  // listAuditLogs
  // -----------------------------------------------------------------------
  describe('listAuditLogs', () => {
    it('should return cursor-paginated audit entries', async () => {
      // Arrange
      const row = { ...baseAuditEntry }
      const chain = createChainMock([row])
      db.select.mockReturnValueOnce(chain)

      // Act
      const result = await service.listAuditLogs({}, undefined, 20)

      // Assert
      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(result.cursor).toBeDefined()
    })

    it('should return hasMore=true with next cursor when more rows exist', async () => {
      // Arrange -- return limit+1 rows to signal more data
      const limit = 2
      const rows = [
        { ...baseAuditEntry, id: 'log-1', timestamp: new Date('2025-06-03') },
        { ...baseAuditEntry, id: 'log-2', timestamp: new Date('2025-06-02') },
        { ...baseAuditEntry, id: 'log-3', timestamp: new Date('2025-06-01') },
      ]
      db.select.mockReturnValueOnce(createChainMock(rows))

      // Act
      const result = await service.listAuditLogs({}, undefined, limit)

      // Assert
      expect(result.cursor.hasMore).toBe(true)
      expect(result.cursor.next).not.toBeNull()
      expect(result.data).toHaveLength(limit)
    })

    it('should return hasMore=false when fewer rows than limit exist', async () => {
      // Arrange
      const rows = [{ ...baseAuditEntry, id: 'log-1', timestamp: new Date('2025-06-01') }]
      db.select.mockReturnValueOnce(createChainMock(rows))

      // Act
      const result = await service.listAuditLogs({}, undefined, 20)

      // Assert
      expect(result.cursor.hasMore).toBe(false)
      expect(result.cursor.next).toBeNull()
    })

    it('should filter by date range (from and to)', async () => {
      // Arrange
      const chain = createChainMock([])
      db.select.mockReturnValueOnce(chain)

      // Act
      await service.listAuditLogs(
        {
          from: new Date('2025-01-01'),
          to: new Date('2025-06-30'),
        },
        undefined,
        20
      )

      // Assert -- where must have been called with date range conditions
      expect(chain.where).toHaveBeenCalled()
    })

    it('should filter by actorId', async () => {
      // Arrange
      const chain = createChainMock([])
      db.select.mockReturnValueOnce(chain)

      // Act
      await service.listAuditLogs({ actorId: 'user-1' }, undefined, 20)

      // Assert
      expect(chain.where).toHaveBeenCalled()
    })

    it('should filter by action type', async () => {
      // Arrange
      const chain = createChainMock([])
      db.select.mockReturnValueOnce(chain)

      // Act
      await service.listAuditLogs({ action: 'user.updated' }, undefined, 20)

      // Assert
      expect(chain.where).toHaveBeenCalled()
    })

    it('should filter by resource type', async () => {
      // Arrange
      const chain = createChainMock([])
      db.select.mockReturnValueOnce(chain)

      // Act
      await service.listAuditLogs({ resource: 'user' }, undefined, 20)

      // Assert
      expect(chain.where).toHaveBeenCalled()
    })

    it('should filter by organizationId', async () => {
      // Arrange
      const chain = createChainMock([])
      db.select.mockReturnValueOnce(chain)

      // Act
      await service.listAuditLogs({ organizationId: 'org-1' }, undefined, 20)

      // Assert
      expect(chain.where).toHaveBeenCalled()
    })

    it('should search action, resource, and resourceId with ILIKE', async () => {
      // Arrange
      const chain = createChainMock([])
      db.select.mockReturnValueOnce(chain)

      // Act
      await service.listAuditLogs({ search: 'updated' }, undefined, 20)

      // Assert
      expect(chain.where).toHaveBeenCalled()
    })

    it('should join actor name via LEFT JOIN on users table', async () => {
      // Arrange
      const row = { ...baseAuditEntry, actorName: 'Alice Admin' }
      const chain = createChainMock([row])
      db.select.mockReturnValueOnce(chain)

      // Act
      const result = await service.listAuditLogs({}, undefined, 20)

      // Assert -- leftJoin must have been called for users table
      expect(chain.leftJoin).toHaveBeenCalled()
      expect(result.data[0]!.actorName).toBe('Alice Admin')
    })

    it('should show [Deleted User] when actor user record is missing', async () => {
      // Arrange -- actorName is null (user record deleted)
      const row = { ...baseAuditEntry, actorName: null }
      const chain = createChainMock([row])
      db.select.mockReturnValueOnce(chain)

      // Act
      const result = await service.listAuditLogs({}, undefined, 20)

      // Assert
      expect(result.data[0]!.actorName).toBe('[Deleted User]')
    })

    it('should apply cursor condition when cursor is provided', async () => {
      // Arrange -- encode a valid cursor
      const cursor = btoa(JSON.stringify({ t: '2025-06-01T10:00:00.000Z', i: 'log-abc' }))
      const chain = createChainMock([])
      db.select.mockReturnValueOnce(chain)

      // Act
      await service.listAuditLogs({}, cursor, 20)

      // Assert -- where should include cursor condition
      expect(chain.where).toHaveBeenCalled()
    })

    it('should return empty data when no entries exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act
      const result = await service.listAuditLogs({}, undefined, 20)

      // Assert
      expect(result.data).toEqual([])
      expect(result.cursor.hasMore).toBe(false)
      expect(result.cursor.next).toBeNull()
    })

    it('should redact sensitive fields in before/after JSONB', async () => {
      // Arrange -- entry with a sensitive field in before/after
      const row = {
        ...baseAuditEntry,
        before: { password: 'secret123', name: 'Old Name' },
        after: { password: 'newsecret', name: 'New Name' },
      }
      const chain = createChainMock([row])
      db.select.mockReturnValueOnce(chain)

      // Act
      const result = await service.listAuditLogs({}, undefined, 20)

      // Assert -- password should be redacted
      expect(result.data[0]!.before).toEqual({ password: '[REDACTED]', name: 'Old Name' })
      expect(result.data[0]!.after).toEqual({ password: '[REDACTED]', name: 'New Name' })
    })
  })

  // -----------------------------------------------------------------------
  // redactSensitiveFields
  // -----------------------------------------------------------------------
  describe('redactSensitiveFields', () => {
    it('should replace sensitive field values with [REDACTED]', () => {
      // Arrange
      const data = { password: 'secret123', token: 'abc-token-xyz' }

      // Act
      const result = service.redactSensitiveFields(data)

      // Assert
      expect(result).toEqual({ password: '[REDACTED]', token: '[REDACTED]' })
    })

    it('should match field names case-insensitively', () => {
      // Arrange
      const data = { Password: 'secret', PASSWORD: 'secret', Token: 'abc' }

      // Act
      const result = service.redactSensitiveFields(data)

      // Assert
      expect(result).toEqual({
        Password: '[REDACTED]',
        PASSWORD: '[REDACTED]',
        Token: '[REDACTED]',
      })
    })

    it('should redact nested sensitive fields', () => {
      // Arrange
      const data = { user: { token: 'abc', name: 'Alice' }, status: 'active' }

      // Act
      const result = service.redactSensitiveFields(data)

      // Assert
      expect(result).toEqual({
        user: { token: '[REDACTED]', name: 'Alice' },
        status: 'active',
      })
    })

    it('should leave non-sensitive fields unchanged', () => {
      // Arrange
      const data = { name: 'Alice', email: 'alice@example.com', role: 'admin' }

      // Act
      const result = service.redactSensitiveFields(data)

      // Assert
      expect(result).toEqual({ name: 'Alice', email: 'alice@example.com', role: 'admin' })
    })

    it('should return null for null input', () => {
      // Act
      const result = service.redactSensitiveFields(null)

      // Assert
      expect(result).toBeNull()
    })

    it('should return empty object for empty object input', () => {
      // Act
      const result = service.redactSensitiveFields({})

      // Assert
      expect(result).toEqual({})
    })

    it('should handle array values correctly without crashing', () => {
      // Arrange -- arrays should be passed through as-is
      const data = { items: [1, 2, 3], password: 'secret' }

      // Act
      const result = service.redactSensitiveFields(data)

      // Assert
      expect(result).toEqual({ items: [1, 2, 3], password: '[REDACTED]' })
    })
  })
})
