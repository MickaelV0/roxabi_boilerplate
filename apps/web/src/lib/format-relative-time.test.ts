import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatRelativeTime } from './format-relative-time'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-24T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "Never" for null', () => {
    expect(formatRelativeTime(null)).toBe('Never')
  })

  it('should return "Never" for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('Never')
  })

  it('should return "Just now" for timestamps less than a minute ago', () => {
    expect(formatRelativeTime('2026-02-24T11:59:30.000Z')).toBe('Just now')
  })

  it('should return "1 minute ago" for exactly 1 minute ago', () => {
    expect(formatRelativeTime('2026-02-24T11:59:00.000Z')).toBe('1 minute ago')
  })

  it('should return "5 minutes ago" for 5 minutes ago', () => {
    expect(formatRelativeTime('2026-02-24T11:55:00.000Z')).toBe('5 minutes ago')
  })

  it('should return "1 hour ago" for exactly 1 hour ago', () => {
    expect(formatRelativeTime('2026-02-24T11:00:00.000Z')).toBe('1 hour ago')
  })

  it('should return "3 hours ago" for 3 hours ago', () => {
    expect(formatRelativeTime('2026-02-24T09:00:00.000Z')).toBe('3 hours ago')
  })

  it('should return "1 day ago" for exactly 1 day ago', () => {
    expect(formatRelativeTime('2026-02-23T12:00:00.000Z')).toBe('1 day ago')
  })

  it('should return "7 days ago" for 7 days ago', () => {
    expect(formatRelativeTime('2026-02-17T12:00:00.000Z')).toBe('7 days ago')
  })
})
