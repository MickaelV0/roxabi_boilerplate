import { Module } from '@nestjs/common'
import { PurgeController } from './purge.controller.js'
import { PurgeService } from './purge.service.js'

@Module({
  controllers: [PurgeController],
  providers: [PurgeService],
})
export class PurgeModule {}
