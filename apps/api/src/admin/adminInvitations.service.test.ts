import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditService } from '../audit/audit.service.js'
import { createChainMock } from './__test-utils__/createChainMock.js'
import { AdminInvitationsService } from './adminInvitations.service.js'
import { InvitationAlreadyPendingException } from './exceptions/invitationAlreadyPending.exception.js'
import { MemberAlreadyExistsException } from './exceptions/memberAlreadyExists.exception.js'
import { AdminRoleNotFoundException } from './exceptions/roleNotFound.exception.js'

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

function createMockAuditService(): AuditService {
  return { log: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService
}

function createMockClsService(id = 'test-correlation-id') {
  return { getId: vi.fn().mockReturnValue(id) }
}

/**
 * Instantiate the service with fresh mocks.
 * Returns the service and its mock collaborators so tests can configure
 * per-call return values.
 */
function createService() {
  const db = createMockDb()
  const auditService = createMockAuditService()
  const cls = createMockClsService()
  const service = new AdminInvitationsService(db as never, auditService, cls as never)
  return { service, db, auditService, cls }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminInvitationsService', () => {
  let service: AdminInvitationsService
  let db: ReturnType<typeof createMockDb>
  let auditService: AuditService

  beforeEach(() => {
    vi.restoreAllMocks()
    ;({ service, db, auditService } = createService())
  })

  // -----------------------------------------------------------------------
  // inviteMember
  // -----------------------------------------------------------------------
  describe('inviteMember', () => {
    it('should create invitation when role exists and no conflicts', async () => {
      // Arrange
      const roleChain = createChainMock([{ id: 'r-member', slug: 'member' }])
      const existingMemberChain = createChainMock([])
      const existingInvitationChain = createChainMock([])
      const invitation = {
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
        status: 'pending',
      }
      const insertChain = createChainMock([invitation])

      db.select
        .mockReturnValueOnce(roleChain) // role lookup
        .mockReturnValueOnce(existingMemberChain) // existing member check
        .mockReturnValueOnce(existingInvitationChain) // existing invitation check
      db.insert.mockReturnValueOnce(insertChain)

      // Act
      const result = await service.inviteMember(
        'org-1',
        { email: 'new@example.com', roleId: 'r-member' },
        'actor-1'
      )

      // Assert
      expect(result).toEqual(invitation)
      expect(db.insert).toHaveBeenCalled()
    })

    it('should throw AdminRoleNotFoundException when role does not exist', async () => {
      // Arrange
      db.select.mockReturnValueOnce(createChainMock([]))

      // Act & Assert
      await expect(
        service.inviteMember('org-1', { email: 'new@example.com', roleId: 'r-invalid' }, 'actor-1')
      ).rejects.toThrow(AdminRoleNotFoundException)
    })

    it('should throw MemberAlreadyExistsException when member already in org', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }])) // role exists
        .mockReturnValueOnce(createChainMock([{ id: 'm-existing' }])) // member exists

      // Act & Assert
      await expect(
        service.inviteMember(
          'org-1',
          { email: 'existing@example.com', roleId: 'r-member' },
          'actor-1'
        )
      ).rejects.toThrow(MemberAlreadyExistsException)
    })

    it('should throw InvitationAlreadyPendingException when pending invitation exists', async () => {
      // Arrange
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }])) // role exists
        .mockReturnValueOnce(createChainMock([])) // no existing member
        .mockReturnValueOnce(createChainMock([{ id: 'inv-existing' }])) // pending invitation

      // Act & Assert
      await expect(
        service.inviteMember(
          'org-1',
          { email: 'pending@example.com', roleId: 'r-member' },
          'actor-1'
        )
      ).rejects.toThrow(InvitationAlreadyPendingException)
    })

    it('should use empty string as resourceId when insert returns no rows', async () => {
      // Arrange -- insert returns empty array so `invitation` is undefined
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }]))
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([]))
      db.insert.mockReturnValueOnce(createChainMock([]))

      // Act
      await service.inviteMember(
        'org-1',
        { email: 'new@example.com', roleId: 'r-member' },
        'actor-1'
      )

      // Assert -- resourceId falls back to ''
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ resourceId: '' }))
    })

    it('should not throw when auditService.log rejects (fire-and-forget)', async () => {
      // Arrange
      const invitation = {
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
        status: 'pending',
      }
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }]))
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([]))
      db.insert.mockReturnValueOnce(createChainMock([invitation]))
      vi.mocked(auditService.log).mockRejectedValue(new Error('audit down'))

      // Act & Assert -- should resolve without throwing
      await expect(
        service.inviteMember('org-1', { email: 'new@example.com', roleId: 'r-member' }, 'actor-1')
      ).resolves.toBeDefined()

      // Flush microtasks so the .catch() handler runs
      await new Promise<void>((resolve) => queueMicrotask(resolve))
    })

    it('should call auditService.log after creating invitation', async () => {
      // Arrange
      const invitation = {
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
        status: 'pending',
      }
      db.select
        .mockReturnValueOnce(createChainMock([{ id: 'r-member', slug: 'member' }]))
        .mockReturnValueOnce(createChainMock([]))
        .mockReturnValueOnce(createChainMock([]))
      db.insert.mockReturnValueOnce(createChainMock([invitation]))

      // Act
      await service.inviteMember(
        'org-1',
        { email: 'new@example.com', roleId: 'r-member' },
        'actor-1'
      )

      // Assert
      expect(auditService.log).toHaveBeenCalledWith({
        actorId: 'actor-1',
        actorType: 'user',
        organizationId: 'org-1',
        action: 'member.invited',
        resource: 'invitation',
        resourceId: 'inv-1',
        after: {
          email: 'new@example.com',
          roleId: 'r-member',
          roleSlug: 'member',
        },
      })
    })
  })
})
