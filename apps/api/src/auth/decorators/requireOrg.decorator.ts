import { SetMetadata } from '@nestjs/common'

export const RequireOrg = () => SetMetadata('REQUIRE_ORG', true)
