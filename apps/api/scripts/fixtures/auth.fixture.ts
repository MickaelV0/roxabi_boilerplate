import { hashPassword } from 'better-auth/crypto'
import * as schema from '../../src/database/schema/index.js'
import type { FixtureContext, Preset, Tx } from './types.js'

export type UserDef = {
  email: string
  name: string
}

export const MINIMAL_USERS: UserDef[] = [
  { email: 'dev@roxabi.local', name: 'Dev User' },
  { email: 'admin@roxabi.local', name: 'Admin User' },
  { email: 'viewer@roxabi.local', name: 'Viewer User' },
]

export const FULL_EXTRA_USERS: UserDef[] = [
  { email: 'manager@roxabi.local', name: 'Manager User' },
  { email: 'editor@roxabi.local', name: 'Editor User' },
  { email: 'analyst@roxabi.local', name: 'Analyst User' },
  { email: 'support@roxabi.local', name: 'Support User' },
  { email: 'designer@roxabi.local', name: 'Designer User' },
  { email: 'devops@roxabi.local', name: 'DevOps User' },
  { email: 'marketing@roxabi.local', name: 'Marketing User' },
  { email: 'sales@roxabi.local', name: 'Sales User' },
  { email: 'intern@roxabi.local', name: 'Intern User' },
]

/** Create users and credential accounts. All users get password "password123". */
export async function seed(tx: Tx, preset: Preset, ctx: FixtureContext): Promise<number> {
  const users = preset === 'full' ? [...MINIMAL_USERS, ...FULL_EXTRA_USERS] : MINIMAL_USERS
  const hashedPassword = await hashPassword('password123')

  for (const userDef of users) {
    const userId = crypto.randomUUID()
    await tx.insert(schema.users).values({
      id: userId,
      name: userDef.name,
      email: userDef.email,
      emailVerified: true,
    })
    await tx.insert(schema.accounts).values({
      id: crypto.randomUUID(),
      userId,
      accountId: userId,
      providerId: 'credential',
      password: hashedPassword,
    })
    ctx.userIds.push(userId)
  }

  return users.length
}
