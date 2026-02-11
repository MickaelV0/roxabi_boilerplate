import { createMockUser, type MockUser } from './mock-user'

/**
 * Factory for session objects used in tests.
 */
export function createMockSession(overrides: Partial<MockSession> = {}): MockSession {
  return {
    id: 'session-1',
    userId: 'user-1',
    token: 'mock-token',
    expiresAt: new Date('2026-12-31T23:59:59Z'),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    activeOrganizationId: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    user: createMockUser(),
    ...overrides,
  }
}

export interface MockSession {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  activeOrganizationId: string | null
  createdAt: Date
  updatedAt: Date
  user: MockUser
}
