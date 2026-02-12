import { describe, expect, it } from 'vitest'
import { hasAllPermissions, hasAnyPermission, hasPermission } from './permissions'

describe('hasPermission', () => {
  it('should return true when session has the permission', () => {
    const session = { permissions: ['members:read', 'roles:write'] }
    expect(hasPermission(session, 'members:read')).toBe(true)
  })

  it('should return false when session lacks the permission', () => {
    const session = { permissions: ['members:read'] }
    expect(hasPermission(session, 'roles:write')).toBe(false)
  })

  it('should return false for null session', () => {
    expect(hasPermission(null, 'members:read')).toBe(false)
  })

  it('should return false for undefined session', () => {
    expect(hasPermission(undefined, 'members:read')).toBe(false)
  })

  it('should return false when permissions array is missing', () => {
    expect(hasPermission({}, 'members:read')).toBe(false)
  })
})

describe('hasAllPermissions', () => {
  it('should return true when session has all permissions', () => {
    const session = { permissions: ['members:read', 'roles:write', 'users:read'] }
    expect(hasAllPermissions(session, ['members:read', 'roles:write'])).toBe(true)
  })

  it('should return false when session is missing one permission', () => {
    const session = { permissions: ['members:read'] }
    expect(hasAllPermissions(session, ['members:read', 'roles:write'])).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('should return true when session has at least one permission', () => {
    const session = { permissions: ['members:read'] }
    expect(hasAnyPermission(session, ['members:read', 'roles:write'])).toBe(true)
  })

  it('should return false when session has none of the permissions', () => {
    const session = { permissions: ['users:read'] }
    expect(hasAnyPermission(session, ['members:read', 'roles:write'])).toBe(false)
  })
})
