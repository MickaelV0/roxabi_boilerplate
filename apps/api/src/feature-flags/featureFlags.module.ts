import { Module } from '@nestjs/common'
import { FeatureFlagService } from './featureFlags.service.js'

@Module({
  providers: [FeatureFlagService],
  exports: [FeatureFlagService],
})
export class FeatureFlagsModule {}
