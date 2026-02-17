import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { ConsentController } from './consent.controller.js'
import { ConsentService } from './consent.service.js'

@Module({
  imports: [AuthModule],
  controllers: [ConsentController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
