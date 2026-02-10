import { SetMetadata } from '@nestjs/common'
import type { Role } from '@repo/types'

export const Roles = (...roles: Role[]) => SetMetadata('ROLES', roles)
