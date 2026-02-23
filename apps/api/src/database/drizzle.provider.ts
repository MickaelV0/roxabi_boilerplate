import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

export const DRIZZLE = Symbol('DRIZZLE')
export const POSTGRES_CLIENT = Symbol('POSTGRES_CLIENT')

export type DrizzleDB = PostgresJsDatabase<typeof schema>
export type DrizzleTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0]
export type PostgresClient = ReturnType<typeof postgres>

export const postgresClientProvider = {
  provide: POSTGRES_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): PostgresClient | null => {
    const logger = new Logger('DrizzleProvider')
    const connectionString = config.get<string>('DATABASE_URL')
    const nodeEnv = config.get<string>('NODE_ENV', 'development')

    if (!connectionString) {
      if (nodeEnv === 'production') {
        throw new Error('DATABASE_URL is required in production')
      }
      logger.warn('DATABASE_URL not set, database features will be unavailable')
      return null
    }

    return postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  },
}

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [POSTGRES_CLIENT],
  useFactory: (client: PostgresClient | null): DrizzleDB | null => {
    if (!client) return null
    return drizzle(client, { schema })
  },
}
