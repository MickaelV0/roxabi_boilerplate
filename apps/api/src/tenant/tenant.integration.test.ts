import { sql } from 'drizzle-orm'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

/**
 * Integration tests for Multi-tenant RLS isolation.
 *
 * These tests require a real PostgreSQL database and verify that:
 * 1. RLS policies correctly isolate tenant data
 * 2. set_config() scopes queries to the correct tenant
 * 3. Cross-tenant access is prevented at the database level
 *
 * Test strategy:
 * - Create a temporary table with tenant_id + RLS
 * - Apply create_tenant_rls_policy() to the temp table
 * - Insert rows as Tenant A, verify Tenant B cannot see them
 * - Verify INSERT with wrong tenant_id is rejected by WITH CHECK
 * - Clean up temp table after tests
 *
 * Requires: DATABASE_URL environment variable pointing to a PostgreSQL database
 * where the 0000_rls_infrastructure.sql migration has already been applied.
 */

const DATABASE_URL = process.env.DATABASE_URL
const TEST_TABLE = 'rls_integration_test'
const TENANT_A = 'tenant-a-integration-test'
const TENANT_B = 'tenant-b-integration-test'

describe.skipIf(!DATABASE_URL)('Tenant RLS Integration', () => {
  let client: ReturnType<typeof postgres>
  let db: PostgresJsDatabase

  beforeAll(async () => {
    // Arrange — create a dedicated postgres client and drizzle instance for tests
    client = postgres(DATABASE_URL as string, {
      max: 5,
      idle_timeout: 10,
      connect_timeout: 10,
    })
    db = drizzle(client)

    // Create a temporary test table with a tenant_id column
    await db.execute(sql`
      DROP TABLE IF EXISTS ${sql.identifier(TEST_TABLE)} CASCADE
    `)
    await db.execute(sql`
      CREATE TABLE ${sql.identifier(TEST_TABLE)} (
        id SERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `)

    // Apply the RLS policy using the infrastructure function from migration 0000
    await db.execute(sql`
      SELECT create_tenant_rls_policy(${TEST_TABLE})
    `)
  })

  afterEach(async () => {
    // Clean up all rows between tests to ensure isolation
    // Use superuser bypass: disable RLS temporarily for cleanup
    await db.execute(sql`
      ALTER TABLE ${sql.identifier(TEST_TABLE)} DISABLE ROW LEVEL SECURITY
    `)
    await db.execute(sql`
      DELETE FROM ${sql.identifier(TEST_TABLE)}
    `)
    await db.execute(sql`
      ALTER TABLE ${sql.identifier(TEST_TABLE)} ENABLE ROW LEVEL SECURITY
    `)
    await db.execute(sql`
      ALTER TABLE ${sql.identifier(TEST_TABLE)} FORCE ROW LEVEL SECURITY
    `)
  })

  afterAll(async () => {
    // Drop the temporary test table and close the connection
    await db.execute(sql`
      DROP TABLE IF EXISTS ${sql.identifier(TEST_TABLE)} CASCADE
    `)
    await client.end()
  })

  /**
   * Helper: execute a callback within a tenant-scoped transaction.
   * Mirrors what TenantService.executeWithTenant() does in production.
   */
  async function withTenant<T>(
    tenantId: string,
    callback: (tx: typeof db) => Promise<T>
  ): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`)
      return callback(tx as unknown as typeof db)
    })
  }

  it('should isolate data between tenants -- Tenant B cannot see Tenant A rows', async () => {
    // Arrange — insert rows as Tenant A
    await withTenant(TENANT_A, async (tx) => {
      await tx.execute(sql`
        INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
        VALUES (${TENANT_A}, 'secret-data-for-a')
      `)
      return null
    })

    // Act — query as Tenant B
    const result = await withTenant(TENANT_B, async (tx) => {
      return tx.execute(sql`
        SELECT * FROM ${sql.identifier(TEST_TABLE)}
      `)
    })

    // Assert — Tenant B sees zero rows
    expect(result).toHaveLength(0)
  })

  it('should reject INSERT with mismatched tenant_id via WITH CHECK policy', async () => {
    // Arrange & Act — set context as Tenant A but try to insert with Tenant B's ID
    const insertAsMismatch = withTenant(TENANT_A, async (tx) => {
      await tx.execute(sql`
        INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
        VALUES (${TENANT_B}, 'should-fail')
      `)
      return null
    })

    // Assert — PostgreSQL should reject this with an RLS violation
    await expect(insertAsMismatch).rejects.toThrow()
  })

  it('should return empty results when no set_config() is called', async () => {
    // Arrange — insert a row as Tenant A (using proper context)
    await withTenant(TENANT_A, async (tx) => {
      await tx.execute(sql`
        INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
        VALUES (${TENANT_A}, 'visible-only-to-a')
      `)
      return null
    })

    // Act — query without setting any tenant context
    // When app.tenant_id is not set, current_setting returns empty string (due to `true` flag),
    // so no rows should match
    const result = await db.transaction(async (tx) => {
      // Do NOT call set_config — simulate a request with no tenant context
      return tx.execute(sql`
        SELECT * FROM ${sql.identifier(TEST_TABLE)}
      `)
    })

    // Assert — no rows visible without tenant context
    expect(result).toHaveLength(0)
  })

  it('should allow same-tenant access -- Tenant A sees own rows', async () => {
    // Arrange — insert multiple rows as Tenant A
    await withTenant(TENANT_A, async (tx) => {
      await tx.execute(sql`
        INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
        VALUES (${TENANT_A}, 'row-1'), (${TENANT_A}, 'row-2'), (${TENANT_A}, 'row-3')
      `)
      return null
    })

    // Act — query as Tenant A
    const result = await withTenant(TENANT_A, async (tx) => {
      return tx.execute(sql`
        SELECT * FROM ${sql.identifier(TEST_TABLE)} ORDER BY data
      `)
    })

    // Assert — Tenant A sees all 3 of its own rows
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ tenant_id: TENANT_A, data: 'row-1' })
    expect(result[1]).toMatchObject({ tenant_id: TENANT_A, data: 'row-2' })
    expect(result[2]).toMatchObject({ tenant_id: TENANT_A, data: 'row-3' })
  })

  it('should clear tenant context after transaction ends', async () => {
    // Arrange — insert as Tenant A in one transaction
    await withTenant(TENANT_A, async (tx) => {
      await tx.execute(sql`
        INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
        VALUES (${TENANT_A}, 'persisted-row')
      `)
      return null
    })

    // Act — open a new transaction without setting tenant context
    // The set_config with local=true should NOT persist across transactions
    const result = await db.transaction(async (tx) => {
      return tx.execute(sql`
        SELECT * FROM ${sql.identifier(TEST_TABLE)}
      `)
    })

    // Assert — tenant context from the first transaction does not leak
    expect(result).toHaveLength(0)
  })

  describe('Cross-tenant UPDATE and DELETE', () => {
    it('should prevent Tenant B from updating Tenant A rows', async () => {
      // Arrange — insert as Tenant A
      await withTenant(TENANT_A, async (tx) => {
        await tx.execute(sql`
          INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
          VALUES (${TENANT_A}, 'original-data')
        `)
        return null
      })

      // Act — Tenant B tries to update Tenant A's rows
      await withTenant(TENANT_B, async (tx) => {
        await tx.execute(sql`
          UPDATE ${sql.identifier(TEST_TABLE)} SET data = 'hacked' WHERE data = 'original-data'
        `)
        return null
      })

      // Assert — Tenant A's data is unchanged (UPDATE silently affected 0 rows)
      const result = await withTenant(TENANT_A, async (tx) => {
        return tx.execute(sql`
          SELECT * FROM ${sql.identifier(TEST_TABLE)}
        `)
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ data: 'original-data' })
    })

    it('should prevent Tenant B from deleting Tenant A rows', async () => {
      // Arrange — insert as Tenant A
      await withTenant(TENANT_A, async (tx) => {
        await tx.execute(sql`
          INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
          VALUES (${TENANT_A}, 'protected-row')
        `)
        return null
      })

      // Act — Tenant B tries to delete Tenant A's rows
      await withTenant(TENANT_B, async (tx) => {
        await tx.execute(sql`
          DELETE FROM ${sql.identifier(TEST_TABLE)} WHERE data = 'protected-row'
        `)
        return null
      })

      // Assert — Tenant A's data still exists (DELETE silently affected 0 rows)
      const result = await withTenant(TENANT_A, async (tx) => {
        return tx.execute(sql`
          SELECT * FROM ${sql.identifier(TEST_TABLE)}
        `)
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ data: 'protected-row' })
    })
  })

  describe('Full pipeline', () => {
    it('should work end-to-end: set_config scopes INSERT + SELECT within a single transaction', async () => {
      // Arrange & Act — insert and query within the same tenant-scoped transaction
      const result = await withTenant(TENANT_A, async (tx) => {
        // Insert two rows
        await tx.execute(sql`
          INSERT INTO ${sql.identifier(TEST_TABLE)} (tenant_id, data)
          VALUES (${TENANT_A}, 'e2e-row-1'), (${TENANT_A}, 'e2e-row-2')
        `)

        // Query within the same transaction
        return tx.execute(sql`
          SELECT * FROM ${sql.identifier(TEST_TABLE)} ORDER BY data
        `)
      })

      // Assert — rows are visible within the same tenant-scoped transaction
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ tenant_id: TENANT_A, data: 'e2e-row-1' })
      expect(result[1]).toMatchObject({ tenant_id: TENANT_A, data: 'e2e-row-2' })

      // Assert — rows are NOT visible to a different tenant
      const otherTenantResult = await withTenant(TENANT_B, async (tx) => {
        return tx.execute(sql`
          SELECT * FROM ${sql.identifier(TEST_TABLE)}
        `)
      })
      expect(otherTenantResult).toHaveLength(0)
    })
  })
})
