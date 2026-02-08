import { Global, Inject, Logger, Module, type OnModuleDestroy } from '@nestjs/common'
import {
  drizzleProvider,
  POSTGRES_CLIENT,
  type PostgresClient,
  postgresClientProvider,
} from './drizzle.provider.js'

@Global()
@Module({
  providers: [postgresClientProvider, drizzleProvider],
  exports: [drizzleProvider, postgresClientProvider],
})
export class DatabaseModule implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name)

  constructor(@Inject(POSTGRES_CLIENT) private readonly client: PostgresClient | null) {}

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end()
      this.logger.log('Database connection closed')
    }
  }
}
