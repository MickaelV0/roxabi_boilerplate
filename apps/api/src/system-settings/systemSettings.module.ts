import { Module } from '@nestjs/common'
import { SystemSettingsService } from './systemSettings.service.js'

@Module({
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
