import { describe, expect, it } from 'vitest'

import { buildDatabaseUrl, parseWorktreeBlock, redactUrl } from './dbBranch.utils.js'

// ---------------------------------------------------------------------------
// redactUrl
// ---------------------------------------------------------------------------

describe('redactUrl', () => {
  it('should redact password from a standard DATABASE_URL', () => {
    // Arrange
    const url = 'postgresql://roxabi:supersecret@localhost:5432/roxabi_42'

    // Act
    const result = redactUrl(url)

    // Assert
    expect(result).toBe('postgresql://roxabi:***@localhost:5432/roxabi_42')
  })

  it('should redact password containing special characters', () => {
    // Arrange
    const url = 'postgresql://user:p@ss!word@host:5432/db'

    // Act — the regex matches greedily up to the last @
    const result = redactUrl(url)

    // Assert
    expect(result).toBe('postgresql://user:***@host:5432/db')
  })

  it('should handle URL without password gracefully', () => {
    // Arrange
    const url = 'postgresql://localhost:5432/roxabi_42'

    // Act
    const result = redactUrl(url)

    // Assert — no colon-before-@ pattern, so nothing is replaced
    expect(result).toBe('postgresql://localhost:5432/roxabi_42')
  })

  it('should return empty string for empty input', () => {
    // Arrange / Act / Assert
    expect(redactUrl('')).toBe('')
  })

  it('should handle URL with default credentials', () => {
    // Arrange
    const url = 'postgresql://roxabi:roxabi@localhost:5432/roxabi_150'

    // Act
    const result = redactUrl(url)

    // Assert
    expect(result).toBe('postgresql://roxabi:***@localhost:5432/roxabi_150')
  })
})

// ---------------------------------------------------------------------------
// buildDatabaseUrl
// ---------------------------------------------------------------------------

describe('buildDatabaseUrl', () => {
  it('should build URL with provided credentials', () => {
    // Arrange
    const dbName = 'roxabi_42'
    const user = 'roxabi'
    const password = 'roxabi'

    // Act
    const result = buildDatabaseUrl(dbName, user, password)

    // Assert
    expect(result).toBe('postgresql://roxabi:roxabi@localhost:5432/roxabi_42')
  })

  it('should include the dbName in the URL path', () => {
    // Arrange
    const dbName = 'roxabi_150'

    // Act
    const result = buildDatabaseUrl(dbName, 'user', 'pass')

    // Assert
    expect(result).toContain('/roxabi_150')
    expect(result.endsWith('/roxabi_150')).toBe(true)
  })

  it('should use default host and port when not specified', () => {
    // Arrange / Act
    const result = buildDatabaseUrl('testdb', 'u', 'p')

    // Assert
    expect(result).toBe('postgresql://u:p@localhost:5432/testdb')
  })

  it('should use custom host and port when specified', () => {
    // Arrange / Act
    const result = buildDatabaseUrl('mydb', 'admin', 'secret', 'db.example.com', 5433)

    // Assert
    expect(result).toBe('postgresql://admin:secret@db.example.com:5433/mydb')
  })

  it('should produce a valid postgresql:// protocol prefix', () => {
    // Arrange / Act
    const result = buildDatabaseUrl('db', 'u', 'p')

    // Assert
    expect(result).toMatch(/^postgresql:\/\//)
  })
})

// ---------------------------------------------------------------------------
// parseWorktreeBlock
// ---------------------------------------------------------------------------

describe('parseWorktreeBlock', () => {
  it('should parse a valid worktree block with feat branch', () => {
    // Arrange
    const block = [
      'worktree /home/user/projects/roxabi-42',
      'HEAD abc1234567890',
      'branch refs/heads/feat/42-user-avatar',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).toEqual({
      path: '/home/user/projects/roxabi-42',
      branch: 'feat/42-user-avatar',
      issueNumber: '42',
    })
  })

  it('should parse a valid worktree block with fix branch', () => {
    // Arrange
    const block = [
      'worktree /home/user/projects/roxabi-15',
      'HEAD def4567890123',
      'branch refs/heads/fix/15-login-redirect',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).toEqual({
      path: '/home/user/projects/roxabi-15',
      branch: 'fix/15-login-redirect',
      issueNumber: '15',
    })
  })

  it('should parse a valid worktree block with hotfix branch', () => {
    // Arrange
    const block = [
      'worktree /home/user/projects/roxabi-99',
      'HEAD 0123456789abc',
      'branch refs/heads/hotfix/99-urgent-patch',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).toEqual({
      path: '/home/user/projects/roxabi-99',
      branch: 'hotfix/99-urgent-patch',
      issueNumber: '99',
    })
  })

  it('should extract issue number from branch name', () => {
    // Arrange
    const block = [
      'worktree /tmp/wt',
      'HEAD abc123',
      'branch refs/heads/feat/160-db-isolation',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).not.toBeNull()
    expect(result?.issueNumber).toBe('160')
  })

  it('should return null for incomplete block missing worktree path', () => {
    // Arrange
    const block = ['HEAD abc123', 'branch refs/heads/feat/42-slug'].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).toBeNull()
  })

  it('should return null for incomplete block missing branch', () => {
    // Arrange
    const block = ['worktree /home/user/projects/roxabi-42', 'HEAD abc123'].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).toBeNull()
  })

  it('should return null issueNumber for main branch', () => {
    // Arrange
    const block = [
      'worktree /home/user/projects/roxabi_boilerplate',
      'HEAD abc123',
      'branch refs/heads/main',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).not.toBeNull()
    expect(result?.issueNumber).toBeNull()
    expect(result?.branch).toBe('main')
  })

  it('should return null issueNumber for staging branch', () => {
    // Arrange
    const block = [
      'worktree /home/user/projects/roxabi_boilerplate',
      'HEAD def456',
      'branch refs/heads/staging',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).not.toBeNull()
    expect(result?.issueNumber).toBeNull()
    expect(result?.branch).toBe('staging')
  })

  it('should return null issueNumber for branch without issue prefix', () => {
    // Arrange
    const block = [
      'worktree /home/user/projects/experiment',
      'HEAD abc123',
      'branch refs/heads/chore/cleanup-deps',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).not.toBeNull()
    expect(result?.issueNumber).toBeNull()
    expect(result?.branch).toBe('chore/cleanup-deps')
  })

  it('should return null for an empty string', () => {
    // Arrange / Act / Assert
    expect(parseWorktreeBlock('')).toBeNull()
  })

  it('should handle block with extra whitespace lines', () => {
    // Arrange
    const block = [
      'worktree /home/user/wt',
      'HEAD abc123',
      'branch refs/heads/feat/7-something',
      '',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).toEqual({
      path: '/home/user/wt',
      branch: 'feat/7-something',
      issueNumber: '7',
    })
  })

  it('should handle worktree paths with spaces', () => {
    // Arrange
    const block = [
      'worktree /home/user/my projects/roxabi-42',
      'HEAD abc123',
      'branch refs/heads/feat/42-test',
    ].join('\n')

    // Act
    const result = parseWorktreeBlock(block)

    // Assert
    expect(result).not.toBeNull()
    expect(result?.path).toBe('/home/user/my projects/roxabi-42')
  })
})
