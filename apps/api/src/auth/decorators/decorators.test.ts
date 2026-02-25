import 'reflect-metadata'
import { describe, expect, it } from 'vitest'

import { AllowAnonymous } from './allowAnonymous.js'
import { OptionalAuth } from './optionalAuth.js'
import { Permissions } from './permissions.decorator.js'
import { RequireOrg } from './requireOrg.decorator.js'
import { Roles } from './roles.decorator.js'
import { Session } from './session.decorator.js'

const ROUTE_ARGS_METADATA = '__routeArguments__'

function createMockExecutionContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }
}

function getSessionFactory() {
  class TestController {
    testMethod(_session: unknown) {}
  }

  Session()(TestController.prototype, 'testMethod', 0)

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod') as Record<
    string,
    { index: number; factory: (data: unknown, ctx: unknown) => unknown }
  >

  const entry = Object.entries(metadata).find(([k]) => k.includes('__customRouteArgs__'))
  if (!entry) throw new Error('Session decorator did not set route args metadata')

  return entry[1].factory
}

describe('AllowAnonymous', () => {
  it('should set PUBLIC metadata to true', () => {
    // Arrange
    @AllowAnonymous()
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('PUBLIC', TestTarget)

    // Assert
    expect(result).toBe(true)
  })
})

describe('OptionalAuth', () => {
  it('should set OPTIONAL_AUTH metadata to true', () => {
    // Arrange
    @OptionalAuth()
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('OPTIONAL_AUTH', TestTarget)

    // Assert
    expect(result).toBe(true)
  })
})

describe('Roles', () => {
  it('should set ROLES metadata with provided roles array', () => {
    // Arrange
    @Roles('superadmin', 'user')
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('ROLES', TestTarget)

    // Assert
    expect(result).toEqual(['superadmin', 'user'])
  })

  it('should set ROLES metadata with a single role', () => {
    // Arrange
    @Roles('superadmin')
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('ROLES', TestTarget)

    // Assert
    expect(result).toEqual(['superadmin'])
  })

  it('should set ROLES metadata with an empty roles array', () => {
    // Arrange
    @Roles()
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('ROLES', TestTarget)

    // Assert
    expect(result).toEqual([])
  })
})

describe('Permissions', () => {
  it('should set PERMISSIONS metadata with a single permission', () => {
    // Arrange
    @Permissions('members:write')
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('PERMISSIONS', TestTarget)

    // Assert
    expect(result).toEqual(['members:write'])
  })

  it('should set PERMISSIONS metadata with multiple permissions', () => {
    // Arrange
    @Permissions('members:write', 'invitations:write')
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('PERMISSIONS', TestTarget)

    // Assert
    expect(result).toEqual(['members:write', 'invitations:write'])
  })

  it('should set PERMISSIONS metadata with an empty permissions array', () => {
    // Arrange
    @Permissions()
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('PERMISSIONS', TestTarget)

    // Assert
    expect(result).toEqual([])
  })

  it('should be retrievable using Reflector pattern', () => {
    // Arrange
    @Permissions('roles:read', 'roles:delete')
    class TestTarget {}

    // Act — simulates what Reflector.get() does internally
    const result = Reflect.getMetadata('PERMISSIONS', TestTarget) as string[]

    // Assert
    expect(result).toHaveLength(2)
    expect(result).toContain('roles:read')
    expect(result).toContain('roles:delete')
  })
})

describe('RequireOrg', () => {
  it('should set REQUIRE_ORG metadata to true', () => {
    // Arrange
    @RequireOrg()
    class TestTarget {}

    // Act
    const result = Reflect.getMetadata('REQUIRE_ORG', TestTarget)

    // Assert
    expect(result).toBe(true)
  })
})

describe('Session', () => {
  it('should extract session from request', () => {
    // Arrange
    const mockSession = { userId: 'user-123', email: 'test@example.com' }
    const ctx = createMockExecutionContext({ session: mockSession })
    const factory = getSessionFactory()

    // Act
    const result = factory(undefined, ctx)

    // Assert
    expect(result).toEqual(mockSession)
  })

  it('should return null when session is undefined', () => {
    // Arrange
    const ctx = createMockExecutionContext({})
    const factory = getSessionFactory()

    // Act
    const result = factory(undefined, ctx)

    // Assert
    expect(result).toBeNull()
  })

  it('should return null when session is null', () => {
    // Arrange
    const ctx = createMockExecutionContext({ session: null })
    const factory = getSessionFactory()

    // Act
    const result = factory(undefined, ctx)

    // Assert
    expect(result).toBeNull()
  })
})
