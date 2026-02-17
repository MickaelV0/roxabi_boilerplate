import { Inject, Injectable, Logger } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'

@Injectable()
export class PurgeService {
  private readonly logger = new Logger(PurgeService.name)

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async runPurge() {
    // TODO: implement — query users where deleteScheduledFor < NOW(), limit 100
    // TODO: implement — for each user, anonymize in a transaction:
    //   - UPDATE users: firstName='Deleted', lastName='User', name='Deleted User',
    //     email='deleted-{uuid}@anonymized.local', image=null, emailVerified=false,
    //     avatarSeed=null, avatarStyle=null
    //   - DELETE sessions, accounts, verifications for user
    //   - DELETE invitations where inviterId=userId or email=user's original email

    // TODO: implement — query organizations where deleteScheduledFor < NOW(), limit 100
    // TODO: implement — for each org, anonymize in a transaction:
    //   - UPDATE organizations: name='Deleted Organization', slug='deleted-{uuid}', logo=null, metadata=null
    //   - DELETE members, invitations, custom roles for org

    // TODO: implement — return { usersAnonymized, orgsAnonymized }
    this.logger.log('Purge cron started')
    throw new Error('Not implemented')
  }
}
