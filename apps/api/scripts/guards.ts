/** Shared guards for seed/reset CLI scripts. */

export function assertNotProduction(scriptName: string): void {
  if (process.env.NODE_ENV === 'production') {
    console.error(`${scriptName}: refusing to run in production (NODE_ENV=production)`)
    process.exit(1)
  }
}

export function requireDatabaseUrl(scriptName: string): string {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error(`${scriptName}: DATABASE_URL environment variable is required`)
    process.exit(1)
  }
  return databaseUrl
}
