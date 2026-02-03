import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const DRIZZLE = Symbol('DRIZZLE')

export type DrizzleDB = PostgresJsDatabase<typeof schema>

export const drizzleProvider = {
  provide: DRIZZLE,
  useFactory: async () => {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      console.warn('DATABASE_URL not set, database features will be unavailable')
      return null
    }

    const client = postgres(connectionString, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    })

    return drizzle(client, { schema })
  },
}
