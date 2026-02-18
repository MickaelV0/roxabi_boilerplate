import * as authFixture from './auth.fixture.js'
import * as consentFixture from './consent.fixture.js'
import * as permissionsFixture from './permissions.fixture.js'
import * as rbacFixture from './rbac.fixture.js'
import * as tenantFixture from './tenant.fixture.js'
import type { DbInstance, FixtureContext, Preset } from './types.js'

export async function runFixtures(db: DbInstance, preset: Preset): Promise<void> {
  await db.transaction(async (tx) => {
    const ctx: FixtureContext = {
      userIds: [],
      orgIds: [],
      memberIds: [],
      membersByOrg: new Map(),
      roleIdsByOrg: new Map(),
    }

    // 1. Global permissions (idempotent)
    const { permissionCount } = await permissionsFixture.seed(tx, preset, ctx)

    // 2. Users + credential accounts
    const { userCount } = await authFixture.seed(tx, preset, ctx)

    // 3. Organizations + members (+ invitations for full)
    const { orgCount, memberCount, invitationCount } = await tenantFixture.seed(tx, preset, ctx)

    // 4. RBAC roles + role-permissions + member.roleId patching
    const { roleCount, rolePermissionCount } = await rbacFixture.seed(tx, preset, ctx)

    // 5. Consent records
    const { consentCount } = await consentFixture.seed(tx, preset, ctx)

    // Summary
    const parts = [
      `${userCount} users`,
      `${orgCount} orgs`,
      `${memberCount} members`,
      `${permissionCount} permissions`,
      `${roleCount} roles`,
      `${rolePermissionCount} role_permissions`,
      `${consentCount} consent_records`,
    ]
    if (invitationCount > 0) {
      parts.push(`${invitationCount} invitations`)
    }
    console.log(`Seeded: ${parts.join(', ')}`)
  })
}

export type { Preset } from './types.js'
