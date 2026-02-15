import { describe, expect, it } from 'vitest'
import { hasAllPermissions, hasAnyPermission, hasPermission } from './permissions'

describe('hasPermission', () => {
  it('should return true when session has the permission', () => {
    // Arrange
    const session = { permissions: ['members:read', 'roles:write'] }

    // Act
    const result = hasPermission(session, 'members:read')

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when session lacks the permission', () => {
    // Arrange
    const session = { permissions: ['members:read'] }

    // Act
    const result = hasPermission(session, 'roles:write')

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for null session', () => {
    // Act
    const result = hasPermission(null, 'members:read')

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for undefined session', () => {
    // Act
    const result = hasPermission(undefined, 'members:read')

    // Assert
    expect(result).toBe(false)
  })

  it('should return false when permissions array is missing', () => {
    // Act
    const result = hasPermission({}, 'members:read')

    // Assert
    expect(result).toBe(false)
  })
})

describe('hasAllPermissions', () => {
  it('should return true when session has all permissions', () => {
    // Arrange
    const session = { permissions: ['members:read', 'roles:write', 'users:read'] }

    // Act
    const result = hasAllPermissions(session, ['members:read', 'roles:write'])

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when session is missing one permission', () => {
    // Arrange
    const session = { permissions: ['members:read'] }

    // Act
    const result = hasAllPermissions(session, ['members:read', 'roles:write'])

    // Assert
    expect(result).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('should return true when session has at least one permission', () => {
    // Arrange
    const session = { permissions: ['members:read'] }

    // Act
    const result = hasAnyPermission(session, ['members:read', 'roles:write'])

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when session has none of the permissions', () => {
    // Arrange
    const session = { permissions: ['users:read'] }

    // Act
    const result = hasAnyPermission(session, ['members:read', 'roles:write'])

    // Assert
    expect(result).toBe(false)
  })
})
