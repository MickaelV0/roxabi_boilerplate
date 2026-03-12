import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationService } from '../../organization/organization.service.js'
import { V1OrganizationsController } from './v1Organizations.controller.js'

const mockOrganizationService: OrganizationService = {
  listForUser: vi.fn(),
} as unknown as OrganizationService

describe('V1OrganizationsController', () => {
  const controller = new V1OrganizationsController(mockOrganizationService)

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockSession = {
    user: { id: 'user-1' },
    session: { activeOrganizationId: 'org-1' },
  }

  describe('listOrganizations', () => {
    it('calls organizationService.listForUser with session userId', async () => {
      // Arrange
      vi.mocked(mockOrganizationService.listForUser).mockResolvedValue([])

      // Act
      await controller.listOrganizations(mockSession as never)

      // Assert
      expect(mockOrganizationService.listForUser).toHaveBeenCalledWith('user-1')
    })

    it('maps org list to V1OrganizationResponse[]', async () => {
      // Arrange
      const createdAt = new Date('2024-01-15T10:00:00.000Z')
      vi.mocked(mockOrganizationService.listForUser).mockResolvedValue([
        { id: 'org-1', name: 'Acme', slug: 'acme', logo: 'https://logo.png', createdAt },
        { id: 'org-2', name: 'Beta Inc', slug: 'beta', logo: null, createdAt },
      ] as never)

      // Act
      const result = await controller.listOrganizations(mockSession as never)

      // Assert
      expect(result).toEqual([
        {
          id: 'org-1',
          name: 'Acme',
          slug: 'acme',
          logo: 'https://logo.png',
          createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 'org-2',
          name: 'Beta Inc',
          slug: 'beta',
          logo: null,
          createdAt: '2024-01-15T10:00:00.000Z',
        },
      ])
    })

    it('returns empty array when user has no organizations', async () => {
      // Arrange
      vi.mocked(mockOrganizationService.listForUser).mockResolvedValue([])

      // Act
      const result = await controller.listOrganizations(mockSession as never)

      // Assert
      expect(result).toEqual([])
    })

    it('maps null slug to empty string', async () => {
      // Arrange
      const createdAt = new Date('2024-01-15T10:00:00.000Z')
      vi.mocked(mockOrganizationService.listForUser).mockResolvedValue([
        { id: 'org-1', name: 'Acme', slug: null, logo: null, createdAt },
      ] as never)

      // Act
      const result = await controller.listOrganizations(mockSession as never)

      // Assert
      expect(result[0]!.slug).toBe('')
    })

    it('propagates errors from organizationService.listForUser', async () => {
      // Arrange
      vi.mocked(mockOrganizationService.listForUser).mockRejectedValue(new Error('DB error'))

      // Act & Assert
      await expect(controller.listOrganizations(mockSession as never)).rejects.toThrow('DB error')
    })
  })
})
