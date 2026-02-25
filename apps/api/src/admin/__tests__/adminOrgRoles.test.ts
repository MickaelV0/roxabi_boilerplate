import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditService } from '../../audit/audit.service.js'
import { createChainMock } from '../__test-utils__/createChainMock.js'
import { AdminMembersService } from '../adminMembers.service.js'
import { AdminOrganizationsService } from '../adminOrganizations.service.js'
import { LastOwnerConstraintException } from '../exceptions/lastOwnerConstraint.exception.js'
import { SelfRoleChangeException } from '../exceptions/selfRoleChange.exception.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  }
}

function mockTransaction(db: ReturnType<typeof createMockDb>) {
  const txSelect = vi.fn()
  const txUpdate = vi.fn()
  const tx = {
    select: txSelect,
    insert: vi.fn(),
    update: txUpdate,
    delete: vi.fn(),
  }
  db.transaction.mockImplementationOnce(async (fn: (tx: Record<string, unknown>) => unknown) =>
    fn(tx)
  )
  return tx
}

function createMockAuditService(): AuditService {
  return { log: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService
}

function createMockClsService(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

function createOrgService() {
  const db = createMockDb()
  const auditService = createMockAuditService()
  const cls = createMockClsService()
  const service = new AdminOrganizationsService(db as never, auditService, cls as never)
  return { service, db, auditService, cls }
}

function createMembersService() {
  const db = createMockDb()
  const auditService = createMockAuditService()
  const cls = createMockClsService()
  const service = new AdminMembersService(db as never, auditService, cls as never)
  return { service, db, auditService, cls }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseOrg = {
  id: 'org-1',
  name: 'Acme Corp',
  slug: 'acme-corp',
  parentOrganizationId: null,
  logo: null,
  metadata: null,
  deletedAt: null,
  deleteScheduledFor: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

/**
 * Test shells for #313 — Org membership context menu (backend).
 * Spec: artifacts/specs/312-313-admin-users-columns-org-membership-editing.mdx
 */
describe('AdminOrganizationsService — listOrgRoles (#313)', () => {
  let service: AdminOrganizationsService
  let db: ReturnType<typeof createMockDb>

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, db } = createOrgService())
  })

  // SC: GET /api/admin/organizations/:orgId/roles returns available roles for the org.
  // Non-superadmin requests return 403.
  it('should return available RBAC roles for an organization', async () => {
    // Arrange — org exists, roles exist
    const orgChain = createChainMock([baseOrg])
    const rolesChain = createChainMock([
      { id: 'r-owner', name: 'Owner', slug: 'owner' },
      { id: 'r-admin', name: 'Admin', slug: 'admin' },
      { id: 'r-member', name: 'Member', slug: 'member' },
    ])
    db.select.mockReturnValueOnce(orgChain).mockReturnValueOnce(rolesChain)

    // Act
    const result = await service.listOrgRoles('org-1')

    // Assert
    expect(result).toEqual({
      data: [
        { id: 'r-owner', name: 'Owner', slug: 'owner' },
        { id: 'r-admin', name: 'Admin', slug: 'admin' },
        { id: 'r-member', name: 'Member', slug: 'member' },
      ],
    })
  })

  // SC: Orgs with no configured RBAC roles show disabled "Change role" with tooltip.
  it('should return empty data array when org has no RBAC roles', async () => {
    // Arrange — org exists, no roles configured
    const orgChain = createChainMock([baseOrg])
    const rolesChain = createChainMock([])
    db.select.mockReturnValueOnce(orgChain).mockReturnValueOnce(rolesChain)

    // Act
    const result = await service.listOrgRoles('org-1')

    // Assert
    expect(result).toEqual({ data: [] })
  })
})

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: test describe block with multiple test cases
describe('AdminMembersService — changeMemberRole last-owner guard (#313)', () => {
  let service: AdminMembersService
  let db: ReturnType<typeof createMockDb>
  let auditService: AuditService

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, db, auditService } = createMembersService())
  })

  // SC: "Change role" submenu is disabled for the current user's row.
  it('should throw SelfRoleChangeException when actor changes own role', async () => {
    // Arrange — target role exists, member.userId === actorId
    const newRole = { id: 'r-admin', slug: 'admin', name: 'Admin' }
    const memberWithRole = {
      id: 'm-1',
      userId: 'actor-1',
      role: 'member',
      roleId: 'r-member',
      currentRoleSlug: 'member',
      currentRoleName: 'Member',
    }

    db.select
      .mockReturnValueOnce(createChainMock([newRole])) // target role lookup
      .mockReturnValueOnce(createChainMock([memberWithRole])) // member lookup (userId matches actorId)

    // Act & Assert
    await expect(
      service.changeMemberRole('m-1', 'org-1', { roleId: 'r-admin' }, 'actor-1')
    ).rejects.toThrow(SelfRoleChangeException)

    // Should not have called update
    expect(db.update).not.toHaveBeenCalled()
  })

  // SC: Attempting to demote the last owner returns 400 with clear error message.
  it('should throw LastOwnerConstraintException when demoting last owner', async () => {
    // Arrange — member is the sole owner
    const newRole = { id: 'r-member', slug: 'member', name: 'Member' }
    const memberWithRole = {
      id: 'm-1',
      userId: 'u-1',
      role: 'owner',
      roleId: 'r-owner',
      currentRoleSlug: 'owner',
      currentRoleName: 'Owner',
    }
    const ownerCount = { count: 1 }

    db.select
      .mockReturnValueOnce(createChainMock([newRole])) // target role
      .mockReturnValueOnce(createChainMock([memberWithRole])) // member (owner)

    // Guard + update run inside a transaction; owner count uses tx.select
    const tx = mockTransaction(db)
    tx.select.mockReturnValueOnce(createChainMock([ownerCount]))

    // Act & Assert
    await expect(
      service.changeMemberRole('m-1', 'org-1', { roleId: 'r-member' }, 'actor-super')
    ).rejects.toThrow(LastOwnerConstraintException)

    // Should not have called tx.update (threw before reaching it)
    expect(tx.update).not.toHaveBeenCalled()
  })

  // SC: All role changes are audit-logged.
  it('should audit-log role changes with before/after snapshots', async () => {
    // Arrange — successful role change from member to admin
    const newRole = { id: 'r-admin', slug: 'admin', name: 'Admin' }
    const memberWithRole = {
      id: 'm-1',
      userId: 'u-1',
      role: 'member',
      roleId: 'r-member',
      currentRoleSlug: 'member',
      currentRoleName: 'Member',
    }

    db.select
      .mockReturnValueOnce(createChainMock([newRole])) // target role
      .mockReturnValueOnce(createChainMock([memberWithRole])) // member with current role

    // Guard + update run inside a transaction
    const tx = mockTransaction(db)
    tx.update.mockReturnValueOnce(createChainMock(undefined))

    // Act
    await service.changeMemberRole('m-1', 'org-1', { roleId: 'r-admin' }, 'actor-super')

    // Assert — audit log called with correct before/after
    expect(auditService.log).toHaveBeenCalledWith({
      actorId: 'actor-super',
      actorType: 'user',
      organizationId: 'org-1',
      action: 'member.role_changed',
      resource: 'member',
      resourceId: 'm-1',
      before: {
        roleId: 'r-member',
        roleSlug: 'member',
        roleName: 'Member',
      },
      after: {
        roleId: 'r-admin',
        roleSlug: 'admin',
        roleName: 'Admin',
      },
    })
  })
})
