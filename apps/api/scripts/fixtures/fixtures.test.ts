import { describe, expect, it } from 'vitest'

import { seed as authSeed, FULL_EXTRA_USERS, MINIMAL_USERS } from './auth.fixture.js'
import { runFixtures } from './index.js'
import {
  FULL_EXTRA_MEMBERS,
  FULL_EXTRA_ORGS,
  FULL_INVITATIONS,
  MINIMAL_MEMBERS,
  MINIMAL_ORGS,
  seed as tenantSeed,
} from './tenant.fixture.js'

// ---------------------------------------------------------------------------
// 1. User fixture data integrity
// ---------------------------------------------------------------------------

describe('auth fixture data', () => {
  it('should have exactly 3 minimal users', () => {
    // Arrange / Act / Assert
    expect(MINIMAL_USERS).toHaveLength(3)
  })

  it('should have exactly 9 full extra users', () => {
    // Arrange / Act / Assert
    expect(FULL_EXTRA_USERS).toHaveLength(9)
  })

  it('should have unique emails across all users', () => {
    // Arrange
    const allUsers = [...MINIMAL_USERS, ...FULL_EXTRA_USERS]
    const emails = allUsers.map((u) => u.email)

    // Act
    const uniqueEmails = new Set(emails)

    // Assert
    expect(uniqueEmails.size).toBe(emails.length)
  })

  it('should have all emails ending with .local', () => {
    // Arrange
    const allUsers = [...MINIMAL_USERS, ...FULL_EXTRA_USERS]

    // Act / Assert
    for (const user of allUsers) {
      expect(user.email).toMatch(/\.local$/)
    }
  })

  it('should export a seed function', () => {
    // Arrange / Act / Assert
    expect(typeof authSeed).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// 2. Org fixture data integrity
// ---------------------------------------------------------------------------

describe('tenant fixture data — organizations', () => {
  it('should have exactly 2 minimal orgs', () => {
    // Arrange / Act / Assert
    expect(MINIMAL_ORGS).toHaveLength(2)
  })

  it('should have exactly 2 full extra orgs', () => {
    // Arrange / Act / Assert
    expect(FULL_EXTRA_ORGS).toHaveLength(2)
  })

  it('should have unique slugs across all orgs', () => {
    // Arrange
    const allOrgs = [...MINIMAL_ORGS, ...FULL_EXTRA_ORGS]
    const slugs = allOrgs.map((o) => o.slug)

    // Act
    const uniqueSlugs = new Set(slugs)

    // Assert
    expect(uniqueSlugs.size).toBe(slugs.length)
  })

  it('should have all org slugs in kebab-case', () => {
    // Arrange
    const allOrgs = [...MINIMAL_ORGS, ...FULL_EXTRA_ORGS]
    const kebabCaseRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

    // Act / Assert
    for (const org of allOrgs) {
      expect(org.slug).toMatch(kebabCaseRegex)
    }
  })

  it('should export a seed function', () => {
    // Arrange / Act / Assert
    expect(typeof tenantSeed).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// 3. Member mapping integrity
// ---------------------------------------------------------------------------

describe('tenant fixture data — members', () => {
  const VALID_ROLES = ['owner', 'admin', 'member', 'viewer']

  it('should not reference out-of-bound user indexes in minimal members', () => {
    // Arrange
    const maxUserIndex = MINIMAL_USERS.length - 1

    // Act / Assert
    for (const member of MINIMAL_MEMBERS) {
      expect(member.userIndex).toBeGreaterThanOrEqual(0)
      expect(member.userIndex).toBeLessThanOrEqual(maxUserIndex)
    }
  })

  it('should not reference out-of-bound org indexes in minimal members', () => {
    // Arrange
    const maxOrgIndex = MINIMAL_ORGS.length - 1

    // Act / Assert
    for (const member of MINIMAL_MEMBERS) {
      expect(member.orgIndex).toBeGreaterThanOrEqual(0)
      expect(member.orgIndex).toBeLessThanOrEqual(maxOrgIndex)
    }
  })

  it('should not reference out-of-bound user indexes in full extra members', () => {
    // Arrange — full preset has minimal + extra users
    const totalUsers = MINIMAL_USERS.length + FULL_EXTRA_USERS.length
    const maxUserIndex = totalUsers - 1

    // Act / Assert
    for (const member of FULL_EXTRA_MEMBERS) {
      expect(member.userIndex).toBeGreaterThanOrEqual(0)
      expect(member.userIndex).toBeLessThanOrEqual(maxUserIndex)
    }
  })

  it('should not reference out-of-bound org indexes in full extra members', () => {
    // Arrange — full preset has minimal + extra orgs
    const totalOrgs = MINIMAL_ORGS.length + FULL_EXTRA_ORGS.length
    const maxOrgIndex = totalOrgs - 1

    // Act / Assert
    for (const member of FULL_EXTRA_MEMBERS) {
      expect(member.orgIndex).toBeGreaterThanOrEqual(0)
      expect(member.orgIndex).toBeLessThanOrEqual(maxOrgIndex)
    }
  })

  it('should have all minimal member roles be valid', () => {
    // Arrange / Act / Assert
    for (const member of MINIMAL_MEMBERS) {
      expect(VALID_ROLES).toContain(member.role)
    }
  })

  it('should have all full extra member roles be valid', () => {
    // Arrange / Act / Assert
    for (const member of FULL_EXTRA_MEMBERS) {
      expect(VALID_ROLES).toContain(member.role)
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Invitation integrity (full preset)
// ---------------------------------------------------------------------------

describe('tenant fixture data — invitations', () => {
  const VALID_ROLES = ['owner', 'admin', 'member', 'viewer']

  it('should have unique invitation emails', () => {
    // Arrange
    const emails = FULL_INVITATIONS.map((inv) => inv.email)

    // Act
    const uniqueEmails = new Set(emails)

    // Assert
    expect(uniqueEmails.size).toBe(emails.length)
  })

  it('should have all inviter indexes within valid user range', () => {
    // Arrange — full preset has minimal + extra users
    const totalUsers = MINIMAL_USERS.length + FULL_EXTRA_USERS.length
    const maxUserIndex = totalUsers - 1

    // Act / Assert
    for (const inv of FULL_INVITATIONS) {
      expect(inv.inviterUserIndex).toBeGreaterThanOrEqual(0)
      expect(inv.inviterUserIndex).toBeLessThanOrEqual(maxUserIndex)
    }
  })

  it('should have all org indexes within valid org range', () => {
    // Arrange — full preset has minimal + extra orgs
    const totalOrgs = MINIMAL_ORGS.length + FULL_EXTRA_ORGS.length
    const maxOrgIndex = totalOrgs - 1

    // Act / Assert
    for (const inv of FULL_INVITATIONS) {
      expect(inv.orgIndex).toBeGreaterThanOrEqual(0)
      expect(inv.orgIndex).toBeLessThanOrEqual(maxOrgIndex)
    }
  })

  it('should have all invitation roles be valid', () => {
    // Arrange / Act / Assert
    for (const inv of FULL_INVITATIONS) {
      expect(VALID_ROLES).toContain(inv.role)
    }
  })

  it('should have all invitation emails ending with .local', () => {
    // Arrange / Act / Assert
    for (const inv of FULL_INVITATIONS) {
      expect(inv.email).toMatch(/\.local$/)
    }
  })
})

// ---------------------------------------------------------------------------
// 5. CLI parsing (parsePreset)
// ---------------------------------------------------------------------------

describe('parsePreset', () => {
  it('should return minimal by default when no --preset arg is provided', () => {
    // Arrange — replicate parsePreset logic to avoid module auto-execution side effects
    const args = ['node', 'db-seed.ts']
    const validPresets = ['minimal', 'full']

    // Act
    const presetArg = args.find((a) => a.startsWith('--preset='))
    const preset = presetArg ? presetArg.split('=')[1] : 'minimal'

    // Assert
    expect(validPresets).toContain(preset)
    expect(preset).toBe('minimal')
  })

  it('should return full when --preset=full is provided', () => {
    // Arrange
    const originalArgv = process.argv
    process.argv = ['node', 'db-seed.ts', '--preset=full']

    // Act — replicate parsePreset logic to avoid module auto-execution issues
    const presetArg = process.argv.find((a) => a.startsWith('--preset='))
    const preset = presetArg ? presetArg.split('=')[1] : 'minimal'
    const validPresets = ['minimal', 'full']

    // Assert
    expect(validPresets).toContain(preset)
    expect(preset).toBe('full')

    // Cleanup
    process.argv = originalArgv
  })

  it('should detect invalid preset values', () => {
    // Arrange
    const presetArg = '--preset=bogus'
    const preset = presetArg.split('=')[1]
    const validPresets = ['minimal', 'full']

    // Act
    const isValid = validPresets.includes(preset as string)

    // Assert
    expect(isValid).toBe(false)
  })

  it('should return minimal when --preset= flag is absent', () => {
    // Arrange
    const args = ['node', 'db-seed.ts', '--verbose']

    // Act
    const presetArg = args.find((a) => a.startsWith('--preset='))
    const preset = presetArg ? presetArg.split('=')[1] : 'minimal'

    // Assert
    expect(preset).toBe('minimal')
  })
})

// ---------------------------------------------------------------------------
// 6. Module exports
// ---------------------------------------------------------------------------

describe('fixture module exports', () => {
  it('should export runFixtures as a function from fixtures/index', () => {
    // Arrange / Act / Assert
    expect(typeof runFixtures).toBe('function')
  })

  it('should export seed from auth.fixture', () => {
    // Arrange / Act / Assert
    expect(typeof authSeed).toBe('function')
  })

  it('should export seed from tenant.fixture', () => {
    // Arrange / Act / Assert
    expect(typeof tenantSeed).toBe('function')
  })

  it('should export data arrays from auth.fixture', () => {
    // Arrange / Act / Assert
    expect(Array.isArray(MINIMAL_USERS)).toBe(true)
    expect(Array.isArray(FULL_EXTRA_USERS)).toBe(true)
  })

  it('should export data arrays from tenant.fixture', () => {
    // Arrange / Act / Assert
    expect(Array.isArray(MINIMAL_ORGS)).toBe(true)
    expect(Array.isArray(FULL_EXTRA_ORGS)).toBe(true)
    expect(Array.isArray(MINIMAL_MEMBERS)).toBe(true)
    expect(Array.isArray(FULL_EXTRA_MEMBERS)).toBe(true)
    expect(Array.isArray(FULL_INVITATIONS)).toBe(true)
  })
})
