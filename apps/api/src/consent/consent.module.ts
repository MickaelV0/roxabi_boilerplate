import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AuthModule } from '../auth/auth.module.js'
import { ConsentController } from './consent.controller.js'
import { ConsentService } from './consent.service.js'
import { ConsentExceptionFilter } from './filters/consent-exception.filter.js'

@Module({
  imports: [AuthModule],
  controllers: [ConsentController],
  providers: [ConsentService, { provide: APP_FILTER, useClass: ConsentExceptionFilter }],
  exports: [ConsentService],
})
export class ConsentModule {}
