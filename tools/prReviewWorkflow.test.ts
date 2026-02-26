import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(import.meta.dirname, '..')

describe('pr-review.yml', () => {
  const raw = readFileSync(`${ROOT}/.github/workflows/pr-review.yml`, 'utf-8')

  it('has cancel-in-progress concurrency', () => {
    // Arrange / Act — parse the relevant line from raw YAML
    const match = raw.match(/cancel-in-progress:\s*(true|false)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match![1]).toBe('true')
  })

  it('concurrency group is scoped to PR number', () => {
    // Arrange / Act
    const match = raw.match(/group:\s*(.+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match![1]).toContain('pull_request.number')
  })

  it('has fork guard on review job', () => {
    // Arrange / Act — find the `if:` line on the review job
    const match = raw.match(/if:\s*(.+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match![1]).toContain('head.repo.full_name')
    expect(match![1]).toContain('github.repository')
  })

  it('has timeout-minutes set', () => {
    // Arrange / Act
    const match = raw.match(/timeout-minutes:\s*(\d+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeGreaterThan(0)
  })

  it('triggers on pull_request opened and synchronize events', () => {
    // Arrange / Act
    const hasOpened = raw.includes('opened')
    const hasSynchronize = raw.includes('synchronize')

    // Assert
    expect(hasOpened).toBe(true)
    expect(hasSynchronize).toBe(true)
  })

  it('requests pull-requests write permission', () => {
    // Arrange / Act
    const match = raw.match(/pull-requests:\s*(\w+)/)

    // Assert
    expect(match).not.toBeNull()
    expect(match![1]).toBe('write')
  })

  it('uploads review-findings artifact with 90-day retention', () => {
    // Arrange / Act
    const hasArtifact = raw.includes('review-findings')
    const match = raw.match(/retention-days:\s*(\d+)/)

    // Assert
    expect(hasArtifact).toBe(true)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBe(90)
  })
})
