import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const DRIZZLE = Symbol('DRIZZLE')

export type DrizzleDB = PostgresJsDatabase<typeof schema>

const logger = new Logger('DrizzleProvider')

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const connectionString = config.get<string>('DATABASE_URL')

    if (!connectionString) {
      logger.warn('DATABASE_URL not set, database features will be unavailable')
      return null
    }

    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })

    return drizzle(client, { schema })
  },
}
