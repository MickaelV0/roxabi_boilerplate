import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(import.meta.dirname, '..')
const raw = readFileSync(`${ROOT}/.github/workflows/pr-review.yml`, 'utf-8')

// ─── pr-review.yml — concurrency and fork guard ───────────────────────────

describe('pr-review.yml — concurrency and fork guard', () => {
  it('has cancel-in-progress concurrency', () => {
    // Act
    const match = raw.match(/cancel-in-progress:\s*(true|false)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match?.[1]).toBe('true')
  })

  it('concurrency group is scoped to PR number', () => {
    // Act
    const match = raw.match(/group:\s*(.+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match?.[1]).toContain('pull_request.number')
  })

  it('has fork guard on review job', () => {
    // Act — find the `if:` line on the review job
    const match = raw.match(/if:\s*(.+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match?.[1]).toContain('head.repo.full_name')
    expect(match?.[1]).toContain('github.repository')
  })

  it('has timeout-minutes set', () => {
    // Act
    const match = raw.match(/timeout-minutes:\s*(\d+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(Number(match?.[1])).toBeGreaterThan(0)
  })
})

// ─── pr-review.yml — trigger and permissions ──────────────────────────────

describe('pr-review.yml — trigger and permissions', () => {
  it('triggers on pull_request opened and synchronize events', () => {
    // Assert
    expect(raw.includes('opened')).toBe(true)
    expect(raw.includes('synchronize')).toBe(true)
  })

  it('requests pull-requests write permission', () => {
    // Act
    const match = raw.match(/pull-requests:\s*(\w+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match?.[1]).toBe('write')
  })

  it('uploads review-findings artifact with 90-day retention', () => {
    // Assert
    expect(raw.includes('review-findings')).toBe(true)
    const match = raw.match(/retention-days:\s*(\d+)/)
    expect(match).not.toBeNull()
    expect(Number(match?.[1])).toBe(90)
  })
})
