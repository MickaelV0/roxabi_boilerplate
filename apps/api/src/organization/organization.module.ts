import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { OrganizationController } from './organization.controller.js'
import { OrganizationService } from './organization.service.js'

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
