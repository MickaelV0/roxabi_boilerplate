/**
 * Check database schema by counting public tables.
 *
 * Expects DATABASE_URL in the environment.
 * Prints the table count to stdout and exits with code 0 on success, 1 on failure.
 */

try {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const postgres = (await import('postgres')).default
  const sql = postgres(databaseUrl, { connect_timeout: 10 })

  const rows = await sql`
    SELECT count(*)::int AS cnt
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `

  console.log(rows[0].cnt)
  await sql.end()
} catch (error) {
  console.error('Failed to check database schema:', error instanceof Error ? error.message : error)
  process.exit(1)
}
