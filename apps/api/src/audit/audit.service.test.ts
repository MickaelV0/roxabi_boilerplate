import { describe, expect, it, vi } from 'vitest'
import { AuditService } from './audit.service.js'

function createMockDb() {
  const valuesFn = vi.fn().mockResolvedValue(undefined)
  const insertFn = vi.fn().mockReturnValue({ values: valuesFn })
  return { insert: insertFn, _valuesFn: valuesFn }
}

describe('AuditService', () => {
  describe('log()', () => {
    it('should insert an audit log entry with all required fields', async () => {
      // Arrange
      const db = createMockDb()
      const service = new AuditService(db as never)
      const entry = {
        actorId: 'user-1',
        actorType: 'user' as const,
        organizationId: 'org-1',
        action: 'member.invited' as const,
        resource: 'invitation',
        resourceId: 'inv-1',
      }

      // Act
      await service.log(entry)

      // Assert
      expect(db.insert).toHaveBeenCalledOnce()
      expect(db._valuesFn).toHaveBeenCalledWith({
        actorId: 'user-1',
        actorType: 'user',
        impersonatorId: null,
        organizationId: 'org-1',
        action: 'member.invited',
        resource: 'invitation',
        resourceId: 'inv-1',
        before: null,
        after: null,
        metadata: null,
        apiKeyId: null,
      })
    })

    it('should pass optional fields when provided', async () => {
      // Arrange
      const db = createMockDb()
      const service = new AuditService(db as never)
      const entry = {
        actorId: 'admin-1',
        actorType: 'impersonation' as const,
        impersonatorId: 'superadmin-1',
        organizationId: 'org-2',
        action: 'member.role_changed' as const,
        resource: 'member',
        resourceId: 'member-1',
        before: { roleId: 'r-old', roleSlug: 'member' },
        after: { roleId: 'r-new', roleSlug: 'admin' },
        metadata: { reason: 'promotion' },
      }

      // Act
      await service.log(entry)

      // Assert
      expect(db._valuesFn).toHaveBeenCalledWith({
        actorId: 'admin-1',
        actorType: 'impersonation',
        impersonatorId: 'superadmin-1',
        organizationId: 'org-2',
        action: 'member.role_changed',
        resource: 'member',
        resourceId: 'member-1',
        before: { roleId: 'r-old', roleSlug: 'member' },
        after: { roleId: 'r-new', roleSlug: 'admin' },
        metadata: { reason: 'promotion' },
        apiKeyId: null,
      })
    })

    it('should default impersonatorId to null when not provided', async () => {
      // Arrange
      const db = createMockDb()
      const service = new AuditService(db as never)

      // Act
      await service.log({
        actorId: 'user-1',
        actorType: 'user' as const,
        action: 'member.removed' as const,
        resource: 'member',
        resourceId: 'member-1',
      })

      // Assert
      const insertedValues = db._valuesFn.mock.calls[0]?.[0] as Record<string, unknown>
      expect(insertedValues.impersonatorId).toBeNull()
    })

    it('should default organizationId to null when not provided', async () => {
      // Arrange
      const db = createMockDb()
      const service = new AuditService(db as never)

      // Act
      await service.log({
        actorId: 'user-1',
        actorType: 'user' as const,
        action: 'member.removed' as const,
        resource: 'member',
        resourceId: 'member-1',
      })

      // Assert
      const insertedValues = db._valuesFn.mock.calls[0]?.[0] as Record<string, unknown>
      expect(insertedValues.organizationId).toBeNull()
    })

    it('should default before, after, and metadata to null when not provided', async () => {
      // Arrange
      const db = createMockDb()
      const service = new AuditService(db as never)

      // Act
      await service.log({
        actorId: 'user-1',
        actorType: 'user' as const,
        action: 'member.invited' as const,
        resource: 'invitation',
        resourceId: 'inv-1',
      })

      // Assert
      const insertedValues = db._valuesFn.mock.calls[0]?.[0] as Record<string, unknown>
      expect(insertedValues.before).toBeNull()
      expect(insertedValues.after).toBeNull()
      expect(insertedValues.metadata).toBeNull()
    })

    it('should handle explicit null values for optional fields', async () => {
      // Arrange
      const db = createMockDb()
      const service = new AuditService(db as never)

      // Act
      await service.log({
        actorId: 'user-1',
        actorType: 'user' as const,
        impersonatorId: undefined,
        organizationId: undefined,
        action: 'member.invited' as const,
        resource: 'invitation',
        resourceId: 'inv-1',
        before: null,
        after: null,
        metadata: null,
      })

      // Assert
      const insertedValues = db._valuesFn.mock.calls[0]?.[0] as Record<string, unknown>
      expect(insertedValues.impersonatorId).toBeNull()
      expect(insertedValues.organizationId).toBeNull()
      expect(insertedValues.before).toBeNull()
      expect(insertedValues.after).toBeNull()
      expect(insertedValues.metadata).toBeNull()
    })

    it('should propagate database errors', async () => {
      // Arrange
      const db = createMockDb()
      db._valuesFn.mockRejectedValue(new Error('DB connection lost'))
      const service = new AuditService(db as never)

      // Act & Assert
      await expect(
        service.log({
          actorId: 'user-1',
          actorType: 'user' as const,
          action: 'member.invited' as const,
          resource: 'invitation',
          resourceId: 'inv-1',
        })
      ).rejects.toThrow('DB connection lost')
    })
  })
})
