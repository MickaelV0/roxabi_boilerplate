import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { DatabaseModule } from './database.module.js'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

const mockedReadFile = readFile as Mock

function createMockClient({
  pingResult,
  migrationsCount,
  existingCoreTables,
}: {
  pingResult?: 'success' | Error
  migrationsCount?: number
  existingCoreTables?: string[]
} = {}) {
  const handler = (strings: TemplateStringsArray) => {
    const query = strings[0]?.trim()

    if (query === 'SELECT 1') {
      if (pingResult instanceof Error) throw pingResult
      return [{ '?column?': 1 }]
    }

    if (query?.includes('information_schema.tables')) {
      const tables = existingCoreTables ?? []
      return tables.map((t) => ({ table_name: t }))
    }

    if (query?.includes('__drizzle_migrations')) {
      return [{ count: migrationsCount ?? 0 }]
    }

    return []
  }

  // The client is both a tagged template function and a regular function
  // (postgres uses client(array) for SQL fragments inside tagged templates)
  const fn = vi.fn(handler)
  return Object.assign(fn, { end: vi.fn() })
}

function createModule(client: ReturnType<typeof createMockClient> | null) {
  return new DatabaseModule(client as never)
}

describe('DatabaseModule', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('onModuleInit', () => {
    it('should skip checks when client is null', async () => {
      // Arrange
      const mod = createModule(null)

      // Act & Assert — should not throw
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })

    it('should verify connection with SELECT 1', async () => {
      // Arrange
      const allCoreTables = ['users', 'sessions', 'accounts', 'verifications']
      const client = createMockClient({ pingResult: 'success', existingCoreTables: allCoreTables })
      const mod = createModule(client)
      mockedReadFile.mockRejectedValue(new Error('ENOENT'))

      // Act
      await mod.onModuleInit()

      // Assert
      expect(client).toHaveBeenCalled()
    })

    it('should throw when database is unreachable', async () => {
      // Arrange
      const client = createMockClient({ pingResult: new Error('connection refused') })
      const mod = createModule(client)

      // Act & Assert
      await expect(mod.onModuleInit()).rejects.toThrow(
        'Database connection failed: connection refused'
      )
    })
  })

  describe('checkPendingMigrations', () => {
    it('should skip when no journal file exists', async () => {
      // Arrange
      const allCoreTables = ['users', 'sessions', 'accounts', 'verifications']
      const client = createMockClient({ pingResult: 'success', existingCoreTables: allCoreTables })
      const mod = createModule(client)
      mockedReadFile.mockRejectedValue(new Error('ENOENT'))

      // Act & Assert — should not throw
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })

    it('should warn when pending migrations are detected', async () => {
      // Arrange
      const allCoreTables = ['users', 'sessions', 'accounts', 'verifications']
      const client = createMockClient({
        pingResult: 'success',
        migrationsCount: 1,
        existingCoreTables: allCoreTables,
      })
      const mod = createModule(client)

      const journal = {
        entries: [
          { idx: 0, tag: '0000_init' },
          { idx: 1, tag: '0001_add_users' },
          { idx: 2, tag: '0002_add_orgs' },
        ],
      }
      mockedReadFile.mockResolvedValue(JSON.stringify(journal))

      // Act & Assert — should not throw (warns, doesn't fail)
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })

    it('should succeed when all migrations are applied', async () => {
      // Arrange
      const allCoreTables = ['users', 'sessions', 'accounts', 'verifications']
      const client = createMockClient({
        pingResult: 'success',
        migrationsCount: 2,
        existingCoreTables: allCoreTables,
      })
      const mod = createModule(client)

      const journal = {
        entries: [
          { idx: 0, tag: '0000_init' },
          { idx: 1, tag: '0001_add_users' },
        ],
      }
      mockedReadFile.mockResolvedValue(JSON.stringify(journal))

      // Act & Assert
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })

    it('should handle missing __drizzle_migrations table gracefully', async () => {
      // Arrange
      const allCoreTables = ['users', 'sessions', 'accounts', 'verifications']
      const client = Object.assign(
        vi.fn((strings: TemplateStringsArray) => {
          const query = strings[0]?.trim()
          if (query === 'SELECT 1') return [{ '?column?': 1 }]
          if (query?.includes('information_schema.tables'))
            return allCoreTables.map((t) => ({ table_name: t }))
          if (query?.includes('__drizzle_migrations')) throw new Error('relation does not exist')
          return []
        }),
        { end: vi.fn() }
      )
      const mod = createModule(client)

      const journal = {
        entries: [{ idx: 0, tag: '0000_init' }],
      }
      mockedReadFile.mockResolvedValue(JSON.stringify(journal))

      // Act & Assert — should warn about pending, not throw
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })
  })

  describe('checkCoreTables', () => {
    it('should log success when all core tables exist', async () => {
      // Arrange
      const allCoreTables = ['users', 'sessions', 'accounts', 'verifications']
      const client = createMockClient({ pingResult: 'success', existingCoreTables: allCoreTables })
      const mod = createModule(client)
      mockedReadFile.mockRejectedValue(new Error('ENOENT'))

      // Act & Assert — should not throw
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })

    it('should warn when some core tables are missing', async () => {
      // Arrange
      const client = createMockClient({
        pingResult: 'success',
        existingCoreTables: ['users', 'accounts'],
      })
      const mod = createModule(client)
      mockedReadFile.mockRejectedValue(new Error('ENOENT'))

      // Act & Assert — should not throw (warns, doesn't fail)
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })

    it('should warn when query fails', async () => {
      // Arrange
      const client = Object.assign(
        vi.fn((strings: TemplateStringsArray) => {
          const query = strings[0]?.trim()
          if (query === 'SELECT 1') return [{ '?column?': 1 }]
          if (query?.includes('information_schema.tables'))
            throw new Error('permission denied for schema information_schema')
          return []
        }),
        { end: vi.fn() }
      )
      const mod = createModule(client)
      mockedReadFile.mockRejectedValue(new Error('ENOENT'))

      // Act & Assert — should not throw (warns, doesn't fail)
      await expect(mod.onModuleInit()).resolves.toBeUndefined()
    })
  })

  describe('onModuleDestroy', () => {
    it('should close connection when client exists', async () => {
      // Arrange
      const client = createMockClient()
      const mod = createModule(client)

      // Act
      await mod.onModuleDestroy()

      // Assert
      expect(client.end).toHaveBeenCalled()
    })

    it('should skip when client is null', async () => {
      // Arrange
      const mod = createModule(null)

      // Act & Assert — should not throw
      await expect(mod.onModuleDestroy()).resolves.toBeUndefined()
    })
  })
})
