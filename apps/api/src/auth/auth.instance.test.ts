import { beforeEach, describe, expect, it, vi } from 'vitest'

// Capture the config passed to betterAuth so we can test databaseHooks
const capturedConfig = vi.hoisted(() => ({
  config: null as Record<string, unknown> | null,
}))

vi.mock('better-auth', () => ({
  betterAuth: (config: Record<string, unknown>) => {
    capturedConfig.config = config
    return { handler: vi.fn(), api: { getSession: vi.fn() } }
  },
}))

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({})),
}))

vi.mock('better-auth/plugins/admin', () => ({
  admin: vi.fn(() => ({})),
}))

vi.mock('better-auth/plugins/magic-link', () => ({
  magicLink: vi.fn(() => ({})),
}))

vi.mock('better-auth/plugins/organization', () => ({
  organization: vi.fn(() => ({})),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ column: _col, value: _val })),
}))

import { createBetterAuth } from './auth.instance.js'

function createMockDb() {
  const whereFn = vi.fn().mockResolvedValue(undefined)
  const setFn = vi.fn().mockReturnValue({ where: whereFn })
  const updateFn = vi.fn().mockReturnValue({ set: setFn })

  return {
    update: updateFn,
    _mocks: { updateFn, setFn, whereFn },
  }
}

function createMockEmailProvider() {
  return { send: vi.fn().mockResolvedValue(undefined) }
}

const defaultConfig = {
  secret: 'test-secret',
  baseURL: 'http://localhost:4000',
  appURL: 'http://localhost:3000',
}

describe('createBetterAuth databaseHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedConfig.config = null
  })

  it('should set default avatar fields and image URL when user has no image (non-OAuth)', async () => {
    // Arrange
    const mockDb = createMockDb()
    createBetterAuth(mockDb as never, createMockEmailProvider() as never, defaultConfig)

    const hooks = capturedConfig.config?.databaseHooks as {
      user: { create: { after: (user: Record<string, unknown>) => Promise<void> } }
    }
    const afterCreateHook = hooks.user.create.after

    const user = { id: 'user-123', name: 'Test User', image: null }

    // Act
    await afterCreateHook(user)

    // Assert - should set image + avatar fields since user has no image
    expect(mockDb._mocks.setFn).toHaveBeenCalledWith({
      avatarStyle: 'lorelei',
      avatarSeed: 'user-123',
      avatarOptions: {},
      image: 'https://api.dicebear.com/9.x/lorelei/svg?seed=user-123',
    })
  })

  it('should keep existing image but set avatar metadata when user has an image (OAuth)', async () => {
    // Arrange
    const mockDb = createMockDb()
    createBetterAuth(mockDb as never, createMockEmailProvider() as never, defaultConfig)

    const hooks = capturedConfig.config?.databaseHooks as {
      user: { create: { after: (user: Record<string, unknown>) => Promise<void> } }
    }
    const afterCreateHook = hooks.user.create.after

    const user = {
      id: 'user-456',
      name: 'OAuth User',
      image: 'https://lh3.googleusercontent.com/photo.jpg',
    }

    // Act
    await afterCreateHook(user)

    // Assert - should NOT set image (keeps OAuth provider image), but sets avatar metadata
    expect(mockDb._mocks.setFn).toHaveBeenCalledWith({
      avatarStyle: 'lorelei',
      avatarSeed: 'user-456',
      avatarOptions: {},
    })
  })

  it('should use the correct user ID as the DiceBear seed', async () => {
    // Arrange
    const mockDb = createMockDb()
    createBetterAuth(mockDb as never, createMockEmailProvider() as never, defaultConfig)

    const hooks = capturedConfig.config?.databaseHooks as {
      user: { create: { after: (user: Record<string, unknown>) => Promise<void> } }
    }
    const afterCreateHook = hooks.user.create.after

    const user = { id: 'unique-id-789', name: 'Seed User', image: null }

    // Act
    await afterCreateHook(user)

    // Assert - seed in URL and avatarSeed should match user.id
    const setCall = mockDb._mocks.setFn.mock.calls[0]?.[0] as Record<string, unknown>
    expect(setCall.avatarSeed).toBe('unique-id-789')
    expect(setCall.image).toContain('seed=unique-id-789')
  })

  it('should update the correct user row by user.id', async () => {
    // Arrange
    const mockDb = createMockDb()
    createBetterAuth(mockDb as never, createMockEmailProvider() as never, defaultConfig)

    const hooks = capturedConfig.config?.databaseHooks as {
      user: { create: { after: (user: Record<string, unknown>) => Promise<void> } }
    }
    const afterCreateHook = hooks.user.create.after

    const user = { id: 'target-user', name: 'Target', image: null }

    // Act
    await afterCreateHook(user)

    // Assert - update should be called with the users table, where should filter by user.id
    expect(mockDb._mocks.updateFn).toHaveBeenCalled()
    expect(mockDb._mocks.whereFn).toHaveBeenCalled()
  })

  it('should treat empty string image as falsy and set default avatar URL', async () => {
    // Arrange
    const mockDb = createMockDb()
    createBetterAuth(mockDb as never, createMockEmailProvider() as never, defaultConfig)

    const hooks = capturedConfig.config?.databaseHooks as {
      user: { create: { after: (user: Record<string, unknown>) => Promise<void> } }
    }
    const afterCreateHook = hooks.user.create.after

    const user = { id: 'user-empty-img', name: 'Empty Image', image: '' }

    // Act
    await afterCreateHook(user)

    // Assert - empty string is falsy, so image should be set
    expect(mockDb._mocks.setFn).toHaveBeenCalledWith({
      avatarStyle: 'lorelei',
      avatarSeed: 'user-empty-img',
      avatarOptions: {},
      image: 'https://api.dicebear.com/9.x/lorelei/svg?seed=user-empty-img',
    })
  })
})
