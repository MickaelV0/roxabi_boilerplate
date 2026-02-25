import { SetMetadata } from '@nestjs/common'

export const OptionalAuth = () => SetMetadata('OPTIONAL_AUTH', true)
