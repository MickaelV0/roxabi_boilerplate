import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminMembersController } from './admin-members.controller.js'
import type { AdminMembersService } from './admin-members.service.js'

const mockAdminMembersService: AdminMembersService = {
  listMembers: vi.fn(),
  inviteMember: vi.fn(),
  changeMemberRole: vi.fn(),
  removeMember: vi.fn(),
} as unknown as AdminMembersService

describe('AdminMembersController', () => {
  const controller = new AdminMembersController(mockAdminMembersService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockSession = {
    user: { id: 'user-1' },
    session: { activeOrganizationId: 'org-1' },
  }

  describe('listMembers', () => {
    it('should delegate to adminMembersService.listMembers with orgId and pagination', async () => {
      // Arrange
      const expected = {
        data: [{ id: 'm-1', userId: 'u-1', role: 'member' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      vi.mocked(mockAdminMembersService.listMembers).mockResolvedValue(expected as never)

      // Act
      const result = await controller.listMembers(mockSession, 1, 20)

      // Assert
      expect(result).toEqual(expected)
      expect(mockAdminMembersService.listMembers).toHaveBeenCalledWith('org-1', {
        page: 1,
        limit: 20,
      })
    })

    it('should pass custom pagination values', async () => {
      // Arrange
      vi.mocked(mockAdminMembersService.listMembers).mockResolvedValue({
        data: [],
        pagination: { page: 3, limit: 10, total: 25, totalPages: 3 },
      } as never)

      // Act
      await controller.listMembers(mockSession, 3, 10)

      // Assert
      expect(mockAdminMembersService.listMembers).toHaveBeenCalledWith('org-1', {
        page: 3,
        limit: 10,
      })
    })

    it('should return empty data when no members exist', async () => {
      // Arrange
      const expected = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
      vi.mocked(mockAdminMembersService.listMembers).mockResolvedValue(expected as never)

      // Act
      const result = await controller.listMembers(mockSession, 1, 20)

      // Assert
      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('inviteMember', () => {
    it('should delegate to adminMembersService.inviteMember with correct args', async () => {
      // Arrange
      const body = { email: 'new@acme.com', roleId: 'r-member' }
      const invitation = { id: 'inv-1', email: 'new@acme.com', role: 'member', status: 'pending' }
      vi.mocked(mockAdminMembersService.inviteMember).mockResolvedValue(invitation as never)

      // Act
      const result = await controller.inviteMember(mockSession, body)

      // Assert
      expect(result).toEqual(invitation)
      expect(mockAdminMembersService.inviteMember).toHaveBeenCalledWith('org-1', body, 'user-1')
    })

    it('should propagate MemberAlreadyExistsException from service', async () => {
      // Arrange
      const { MemberAlreadyExistsException } = await import(
        './exceptions/member-already-exists.exception.js'
      )
      vi.mocked(mockAdminMembersService.inviteMember).mockRejectedValue(
        new MemberAlreadyExistsException()
      )

      // Act & Assert
      await expect(
        controller.inviteMember(mockSession, { email: 'existing@acme.com', roleId: 'r-1' })
      ).rejects.toThrow(MemberAlreadyExistsException)
    })

    it('should propagate InvitationAlreadyPendingException from service', async () => {
      // Arrange
      const { InvitationAlreadyPendingException } = await import(
        './exceptions/invitation-already-pending.exception.js'
      )
      vi.mocked(mockAdminMembersService.inviteMember).mockRejectedValue(
        new InvitationAlreadyPendingException()
      )

      // Act & Assert
      await expect(
        controller.inviteMember(mockSession, { email: 'pending@acme.com', roleId: 'r-1' })
      ).rejects.toThrow(InvitationAlreadyPendingException)
    })
  })

  describe('changeMemberRole', () => {
    it('should delegate to adminMembersService.changeMemberRole with correct args', async () => {
      // Arrange
      const body = { roleId: 'r-admin' }
      vi.mocked(mockAdminMembersService.changeMemberRole).mockResolvedValue({ updated: true })

      // Act
      const result = await controller.changeMemberRole('member-1', mockSession, body)

      // Assert
      expect(result).toEqual({ updated: true })
      expect(mockAdminMembersService.changeMemberRole).toHaveBeenCalledWith(
        'member-1',
        'org-1',
        body,
        'user-1'
      )
    })

    it('should propagate RoleNotFoundException from service', async () => {
      // Arrange
      const { RoleNotFoundException } = await import(
        '../rbac/exceptions/role-not-found.exception.js'
      )
      vi.mocked(mockAdminMembersService.changeMemberRole).mockRejectedValue(
        new RoleNotFoundException('r-invalid')
      )

      // Act & Assert
      await expect(
        controller.changeMemberRole('member-1', mockSession, { roleId: 'r-invalid' })
      ).rejects.toThrow(RoleNotFoundException)
    })

    it('should propagate MemberNotFoundException from service', async () => {
      // Arrange
      const { MemberNotFoundException } = await import(
        '../rbac/exceptions/member-not-found.exception.js'
      )
      vi.mocked(mockAdminMembersService.changeMemberRole).mockRejectedValue(
        new MemberNotFoundException('m-missing')
      )

      // Act & Assert
      await expect(
        controller.changeMemberRole('m-missing', mockSession, { roleId: 'r-1' })
      ).rejects.toThrow(MemberNotFoundException)
    })
  })

  describe('removeMember', () => {
    it('should delegate to adminMembersService.removeMember with correct args', async () => {
      // Arrange
      vi.mocked(mockAdminMembersService.removeMember).mockResolvedValue({ removed: true })

      // Act
      const result = await controller.removeMember('member-1', mockSession)

      // Assert — controller returns void (204 No Content)
      expect(result).toBeUndefined()
      expect(mockAdminMembersService.removeMember).toHaveBeenCalledWith(
        'member-1',
        'org-1',
        'user-1'
      )
    })

    it('should propagate LastOwnerConstraintException from service', async () => {
      // Arrange
      const { LastOwnerConstraintException } = await import(
        './exceptions/last-owner-constraint.exception.js'
      )
      vi.mocked(mockAdminMembersService.removeMember).mockRejectedValue(
        new LastOwnerConstraintException()
      )

      // Act & Assert
      await expect(controller.removeMember('owner-member', mockSession)).rejects.toThrow(
        LastOwnerConstraintException
      )
    })

    it('should propagate MemberNotFoundException from service', async () => {
      // Arrange
      const { MemberNotFoundException } = await import(
        '../rbac/exceptions/member-not-found.exception.js'
      )
      vi.mocked(mockAdminMembersService.removeMember).mockRejectedValue(
        new MemberNotFoundException('m-missing')
      )

      // Act & Assert
      await expect(controller.removeMember('m-missing', mockSession)).rejects.toThrow(
        MemberNotFoundException
      )
    })
  })
})
