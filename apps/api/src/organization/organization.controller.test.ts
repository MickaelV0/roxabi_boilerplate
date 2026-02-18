import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrgNameConfirmationMismatchException } from './exceptions/org-name-confirmation-mismatch.exception.js'
import { OrgNotFoundException } from './exceptions/org-not-found.exception.js'
import { OrganizationController } from './organization.controller.js'
import type { OrganizationService } from './organization.service.js'

const mockOrganizationService: OrganizationService = {
  listForUser: vi.fn(),
  softDelete: vi.fn(),
  reactivate: vi.fn(),
  getDeletionImpact: vi.fn(),
} as unknown as OrganizationService

describe('OrganizationController', () => {
  const controller = new OrganizationController(mockOrganizationService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockSession = { user: { id: 'user-1' } }

  describe('listOrganizations', () => {
    it('should delegate to organizationService.listForUser and return the result', async () => {
      // Arrange
      const orgs = [
        { id: 'org-1', name: 'Alpha', slug: 'alpha', logo: null, createdAt: new Date() },
        { id: 'org-2', name: 'Beta', slug: 'beta', logo: null, createdAt: new Date() },
      ]
      vi.mocked(mockOrganizationService.listForUser).mockResolvedValue(orgs)

      // Act
      const result = await controller.listOrganizations(mockSession)

      // Assert
      expect(result).toEqual(orgs)
      expect(mockOrganizationService.listForUser).toHaveBeenCalledWith('user-1')
    })

    it('should return empty array when user has no memberships', async () => {
      // Arrange
      vi.mocked(mockOrganizationService.listForUser).mockResolvedValue([])

      // Act
      const result = await controller.listOrganizations(mockSession)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('deleteOrganization', () => {
    it('should delegate to organizationService.softDelete with correct arguments', async () => {
      // Arrange
      const deletedOrg = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        deletedAt: new Date(),
        deleteScheduledFor: new Date(),
      }
      vi.mocked(mockOrganizationService.softDelete).mockResolvedValue(deletedOrg)

      // Act
      const result = await controller.deleteOrganization('org-1', mockSession, {
        confirmName: 'Test Org',
      })

      // Assert
      expect(result).toEqual(deletedOrg)
      expect(mockOrganizationService.softDelete).toHaveBeenCalledWith('org-1', 'user-1', 'Test Org')
    })

    it('should propagate OrgNotFoundException when org not found', async () => {
      // Arrange
      vi.mocked(mockOrganizationService.softDelete).mockRejectedValue(
        new OrgNotFoundException('nonexistent')
      )

      // Act & Assert
      await expect(
        controller.deleteOrganization('nonexistent', mockSession, { confirmName: 'X' })
      ).rejects.toThrow(OrgNotFoundException)
    })

    it('should propagate OrgNameConfirmationMismatchException when name does not match', async () => {
      // Arrange
      vi.mocked(mockOrganizationService.softDelete).mockRejectedValue(
        new OrgNameConfirmationMismatchException()
      )

      // Act & Assert
      await expect(
        controller.deleteOrganization('org-1', mockSession, { confirmName: 'Wrong Name' })
      ).rejects.toThrow(OrgNameConfirmationMismatchException)
    })
  })

  describe('reactivateOrganization', () => {
    it('should delegate to organizationService.reactivate with correct arguments', async () => {
      // Arrange
      const reactivatedOrg = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        deletedAt: null,
        deleteScheduledFor: null,
      }
      vi.mocked(mockOrganizationService.reactivate).mockResolvedValue(reactivatedOrg)

      // Act
      const result = await controller.reactivateOrganization('org-1', mockSession)

      // Assert
      expect(result).toEqual(reactivatedOrg)
      expect(mockOrganizationService.reactivate).toHaveBeenCalledWith('org-1', 'user-1')
    })
  })

  describe('getDeletionImpact', () => {
    it('should return deletion impact summary from the service', async () => {
      // Arrange
      const impact = { memberCount: 5, invitationCount: 2, customRoleCount: 1 }
      vi.mocked(mockOrganizationService.getDeletionImpact).mockResolvedValue(impact)

      // Act
      const result = await controller.getDeletionImpact('org-1')

      // Assert
      expect(result).toEqual(impact)
      expect(mockOrganizationService.getDeletionImpact).toHaveBeenCalledWith('org-1')
    })

    it('should propagate OrgNotFoundException when org not found', async () => {
      // Arrange
      vi.mocked(mockOrganizationService.getDeletionImpact).mockRejectedValue(
        new OrgNotFoundException('nonexistent')
      )

      // Act & Assert
      await expect(controller.getDeletionImpact('nonexistent')).rejects.toThrow(
        OrgNotFoundException
      )
    })
  })
})
