import * as schema from '../../src/database/schema/index.js'
import type { FixtureContext, Preset, Tx } from './types.js'

type OrgDef = {
  name: string
  slug: string
}

type MemberDef = {
  userIndex: number // index into ctx.userIds
  orgIndex: number // index into ctx.orgIds
  role: string
}

type InvitationDef = {
  orgIndex: number
  inviterUserIndex: number
  email: string
  role: string
}

const MINIMAL_ORGS: OrgDef[] = [
  { name: 'Roxabi Dev', slug: 'roxabi-dev' },
  { name: 'Acme Corp', slug: 'acme-corp' },
]

const FULL_EXTRA_ORGS: OrgDef[] = [
  { name: 'Startup Inc', slug: 'startup-inc' },
  { name: 'Agency Pro', slug: 'agency-pro' },
]

/**
 * Minimal members mapping:
 *   user 0 (dev)    -> org 0 (Roxabi Dev) as owner
 *   user 1 (admin)  -> org 0 (Roxabi Dev) as admin
 *   user 2 (viewer) -> org 0 (Roxabi Dev) as viewer
 *   user 2 (viewer) -> org 1 (Acme Corp)  as member
 */
const MINIMAL_MEMBERS: MemberDef[] = [
  { userIndex: 0, orgIndex: 0, role: 'owner' },
  { userIndex: 1, orgIndex: 0, role: 'admin' },
  { userIndex: 2, orgIndex: 0, role: 'viewer' },
  { userIndex: 2, orgIndex: 1, role: 'member' },
]

/**
 * Full preset extra members (indexes 3-11 are the extra users).
 * Spread across all 4 orgs with realistic role assignments.
 * Some users appear in multiple orgs (cross-org members).
 */
const FULL_EXTRA_MEMBERS: MemberDef[] = [
  // Acme Corp — populate with several users
  { userIndex: 3, orgIndex: 1, role: 'owner' }, // manager -> Acme owner
  { userIndex: 4, orgIndex: 1, role: 'admin' }, // editor -> Acme admin
  { userIndex: 5, orgIndex: 1, role: 'member' }, // analyst -> Acme member
  { userIndex: 6, orgIndex: 1, role: 'viewer' }, // support -> Acme viewer

  // Startup Inc
  { userIndex: 7, orgIndex: 2, role: 'owner' }, // designer -> Startup owner
  { userIndex: 8, orgIndex: 2, role: 'admin' }, // devops -> Startup admin
  { userIndex: 9, orgIndex: 2, role: 'member' }, // marketing -> Startup member
  { userIndex: 0, orgIndex: 2, role: 'member' }, // dev -> Startup member (cross-org)

  // Agency Pro
  { userIndex: 10, orgIndex: 3, role: 'owner' }, // sales -> Agency owner
  { userIndex: 11, orgIndex: 3, role: 'admin' }, // intern -> Agency admin
  { userIndex: 3, orgIndex: 3, role: 'member' }, // manager -> Agency member (cross-org)
  { userIndex: 5, orgIndex: 3, role: 'viewer' }, // analyst -> Agency viewer (cross-org)

  // Additional cross-org for Roxabi Dev
  { userIndex: 6, orgIndex: 0, role: 'member' }, // support -> Roxabi member (cross-org)
]

/** Full preset pending invitations. */
const FULL_INVITATIONS: InvitationDef[] = [
  // Roxabi Dev (2 pending)
  { orgIndex: 0, inviterUserIndex: 0, email: 'invite1@roxabi.local', role: 'member' },
  { orgIndex: 0, inviterUserIndex: 0, email: 'invite2@roxabi.local', role: 'viewer' },

  // Acme Corp (3 pending)
  { orgIndex: 1, inviterUserIndex: 3, email: 'invite3@acme.local', role: 'member' },
  { orgIndex: 1, inviterUserIndex: 3, email: 'invite4@acme.local', role: 'admin' },
  { orgIndex: 1, inviterUserIndex: 4, email: 'invite5@acme.local', role: 'viewer' },

  // Startup Inc (2 pending)
  { orgIndex: 2, inviterUserIndex: 7, email: 'invite6@startup.local', role: 'member' },
  { orgIndex: 2, inviterUserIndex: 7, email: 'invite7@startup.local', role: 'member' },

  // Agency Pro (3 pending)
  { orgIndex: 3, inviterUserIndex: 10, email: 'invite8@agency.local', role: 'member' },
  { orgIndex: 3, inviterUserIndex: 10, email: 'invite9@agency.local', role: 'admin' },
  { orgIndex: 3, inviterUserIndex: 11, email: 'invite10@agency.local', role: 'viewer' },
]

/** Create organizations, members, and (for full preset) invitations. */
export async function seed(
  tx: Tx,
  preset: Preset,
  ctx: FixtureContext
): Promise<{ orgCount: number; memberCount: number; invitationCount: number }> {
  const orgs = preset === 'full' ? [...MINIMAL_ORGS, ...FULL_EXTRA_ORGS] : MINIMAL_ORGS
  const memberDefs =
    preset === 'full' ? [...MINIMAL_MEMBERS, ...FULL_EXTRA_MEMBERS] : MINIMAL_MEMBERS

  // Create organizations
  for (const orgDef of orgs) {
    const orgId = crypto.randomUUID()
    await tx.insert(schema.organizations).values({
      id: orgId,
      name: orgDef.name,
      slug: orgDef.slug,
    })
    ctx.orgIds.push(orgId)
  }

  // Create members (roleId null — patched later by rbac fixture)
  for (const memberDef of memberDefs) {
    const memberId = crypto.randomUUID()
    await tx.insert(schema.members).values({
      id: memberId,
      userId: ctx.userIds[memberDef.userIndex],
      organizationId: ctx.orgIds[memberDef.orgIndex],
      role: memberDef.role,
      roleId: null,
    })
    ctx.memberIds.push(memberId)
  }

  // Create invitations (full preset only)
  let invitationCount = 0
  if (preset === 'full') {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7) // expires 7 days from now

    for (const inv of FULL_INVITATIONS) {
      await tx.insert(schema.invitations).values({
        id: crypto.randomUUID(),
        organizationId: ctx.orgIds[inv.orgIndex],
        inviterId: ctx.userIds[inv.inviterUserIndex],
        email: inv.email,
        role: inv.role,
        status: 'pending',
        expiresAt: futureDate,
      })
      invitationCount++
    }
  }

  return { orgCount: orgs.length, memberCount: memberDefs.length, invitationCount }
}
