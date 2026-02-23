import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminInvitationsController } from './admin-invitations.controller.js'
import type { AdminMembersService } from './admin-members.service.js'

const mockAdminMembersService: AdminMembersService = {
  listPendingInvitations: vi.fn(),
  revokeInvitation: vi.fn(),
  listMembers: vi.fn(),
  inviteMember: vi.fn(),
  changeMemberRole: vi.fn(),
  removeMember: vi.fn(),
} as unknown as AdminMembersService

describe('AdminInvitationsController', () => {
  const controller = new AdminInvitationsController(mockAdminMembersService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockSession = {
    user: { id: 'user-1' },
    session: { activeOrganizationId: 'org-1' },
  }

  describe('listPendingInvitations', () => {
    it('should delegate to adminMembersService.listPendingInvitations with orgId', async () => {
      // Arrange
      const expected = {
        data: [
          {
            id: 'inv-1',
            email: 'alice@example.com',
            role: 'member',
            status: 'pending',
            expiresAt: '2026-03-01T00:00:00.000Z',
          },
        ],
      }
      vi.mocked(mockAdminMembersService.listPendingInvitations).mockResolvedValue(expected as never)

      // Act
      const result = await controller.listPendingInvitations(mockSession)

      // Assert
      expect(result).toEqual(expected)
      expect(mockAdminMembersService.listPendingInvitations).toHaveBeenCalledWith('org-1')
    })

    it('should return empty data when no invitations exist', async () => {
      // Arrange
      vi.mocked(mockAdminMembersService.listPendingInvitations).mockResolvedValue({
        data: [],
      } as never)

      // Act
      const result = await controller.listPendingInvitations(mockSession)

      // Assert
      expect(result.data).toEqual([])
    })
  })

  describe('revokeInvitation', () => {
    it('should delegate to adminMembersService.revokeInvitation with correct args', async () => {
      // Arrange
      vi.mocked(mockAdminMembersService.revokeInvitation).mockResolvedValue({
        revoked: true,
      } as never)

      // Act
      const result = await controller.revokeInvitation('inv-1', mockSession)

      // Assert -- controller returns void (204 No Content)
      expect(result).toBeUndefined()
      expect(mockAdminMembersService.revokeInvitation).toHaveBeenCalledWith(
        'inv-1',
        'org-1',
        'user-1'
      )
    })

    it('should propagate InvitationNotFoundException from service', async () => {
      // Arrange
      const { InvitationNotFoundException } = await import(
        './exceptions/invitation-not-found.exception.js'
      )
      vi.mocked(mockAdminMembersService.revokeInvitation).mockRejectedValue(
        new InvitationNotFoundException('inv-missing')
      )

      // Act & Assert
      await expect(controller.revokeInvitation('inv-missing', mockSession)).rejects.toThrow(
        InvitationNotFoundException
      )
    })
  })
})
