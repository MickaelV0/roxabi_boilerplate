import { describe, expect, it } from 'vitest'
import { statusLabel, statusVariant } from './user-status'

describe('statusVariant', () => {
  it('should return destructive for banned users', () => {
    expect(statusVariant({ banned: true, deletedAt: null })).toBe('destructive')
  })

  it('should return secondary for archived users', () => {
    expect(statusVariant({ banned: false, deletedAt: '2026-01-01T00:00:00Z' })).toBe('secondary')
  })

  it('should return default for active users', () => {
    expect(statusVariant({ banned: false, deletedAt: null })).toBe('default')
  })
})

describe('statusLabel', () => {
  it('should return Banned for banned users', () => {
    expect(statusLabel({ banned: true, deletedAt: null })).toBe('Banned')
  })

  it('should return Archived for deleted users', () => {
    expect(statusLabel({ banned: false, deletedAt: '2026-01-01T00:00:00Z' })).toBe('Archived')
  })

  it('should return Active for normal users', () => {
    expect(statusLabel({ banned: false, deletedAt: null })).toBe('Active')
  })
})
