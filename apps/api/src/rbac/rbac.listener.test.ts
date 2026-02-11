import { describe, expect, it, vi } from 'vitest'
import { OrganizationCreatedEvent } from '../common/events/organization-created.event.js'
import { RbacListener } from './rbac.listener.js'

function chain(terminal: string, value: unknown) {
  const obj: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const m of ['select', 'from', 'where', 'limit', 'update', 'set']) {
    obj[m] = vi.fn().mockReturnValue(obj)
  }
  obj[terminal].mockResolvedValue(value)
  return obj
}

describe('RbacListener', () => {
  it('should seed default roles and assign Owner to creator', async () => {
    const mockRbacService = {
      seedDefaultRoles: vi.fn().mockResolvedValue(undefined),
    }

    const ownerRoleChain = chain('limit', [{ id: 'role-owner' }])
    const updateChain = chain('where', undefined)

    const mockDb = {
      select: vi.fn().mockReturnValue(ownerRoleChain),
      update: vi.fn().mockReturnValue(updateChain),
    }

    const listener = new RbacListener(mockRbacService as never, mockDb as never)
    const event = new OrganizationCreatedEvent('org-1', 'user-1')
    await listener.handleOrganizationCreated(event)

    expect(mockRbacService.seedDefaultRoles).toHaveBeenCalledWith('org-1')
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('should skip member update when no Owner role found', async () => {
    const mockRbacService = {
      seedDefaultRoles: vi.fn().mockResolvedValue(undefined),
    }

    const ownerRoleChain = chain('limit', [])

    const mockDb = {
      select: vi.fn().mockReturnValue(ownerRoleChain),
      update: vi.fn(),
    }

    const listener = new RbacListener(mockRbacService as never, mockDb as never)
    const event = new OrganizationCreatedEvent('org-1', 'user-1')
    await listener.handleOrganizationCreated(event)

    expect(mockRbacService.seedDefaultRoles).toHaveBeenCalledWith('org-1')
    expect(mockDb.update).not.toHaveBeenCalled()
  })
})
