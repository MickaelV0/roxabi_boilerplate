import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../shared/github', () => ({
  run: vi.fn(),
  getNodeId: vi.fn(),
  addToProject: vi.fn(),
  updateField: vi.fn(),
  addBlockedBy: vi.fn(),
  addSubIssue: vi.fn(),
}))

const github = await import('../../shared/github')
const mockRun = vi.mocked(github.run)
const mockGetNodeId = vi.mocked(github.getNodeId)
const mockAddToProject = vi.mocked(github.addToProject)
const mockUpdateField = vi.mocked(github.updateField)
const mockAddBlockedBy = vi.mocked(github.addBlockedBy)
const mockAddSubIssue = vi.mocked(github.addSubIssue)

const { createIssue } = await import('../lib/create')

describe('issue-triage/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: gh issue create returns URL with issue number
    mockRun.mockResolvedValue('https://github.com/test/repo/issues/99')
    mockGetNodeId.mockImplementation(async (num) => `node-${num}`)
    mockAddToProject.mockResolvedValue('item-99')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an issue with title', async () => {
    await createIssue(['--title', 'Test issue'])
    expect(mockRun).toHaveBeenCalledWith(
      expect.arrayContaining(['gh', 'issue', 'create', '--title', 'Test issue'])
    )
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Created #99'))
  })

  it('adds issue to project board', async () => {
    await createIssue(['--title', 'Test'])
    expect(mockGetNodeId).toHaveBeenCalledWith(99)
    expect(mockAddToProject).toHaveBeenCalledWith('node-99')
  })

  it('sets size on creation', async () => {
    await createIssue(['--title', 'Test', '--size', 'M'])
    expect(mockUpdateField).toHaveBeenCalledWith('item-99', expect.any(String), 'e2c52fb1')
  })

  it('sets priority on creation', async () => {
    await createIssue(['--title', 'Test', '--priority', 'High'])
    expect(mockUpdateField).toHaveBeenCalledWith('item-99', expect.any(String), '742ac87b')
  })

  it('sets parent relationship', async () => {
    await createIssue(['--title', 'Child', '--parent', '50'])
    expect(mockAddSubIssue).toHaveBeenCalledWith('node-50', 'node-99')
  })

  it('adds children', async () => {
    await createIssue(['--title', 'Epic', '--add-child', '60,61'])
    expect(mockAddSubIssue).toHaveBeenCalledWith('node-99', 'node-60')
    expect(mockAddSubIssue).toHaveBeenCalledWith('node-99', 'node-61')
  })

  it('sets blocked-by dependencies', async () => {
    await createIssue(['--title', 'Test', '--blocked-by', '10,11'])
    expect(mockAddBlockedBy).toHaveBeenCalledWith('node-99', 'node-10')
    expect(mockAddBlockedBy).toHaveBeenCalledWith('node-99', 'node-11')
  })

  it('sets blocking dependencies', async () => {
    await createIssue(['--title', 'Test', '--blocks', '20'])
    expect(mockAddBlockedBy).toHaveBeenCalledWith('node-20', 'node-99')
  })

  it('includes labels in create command', async () => {
    await createIssue(['--title', 'Test', '--label', 'bug,frontend'])
    const createCall = mockRun.mock.calls[0][0]
    expect(createCall).toContain('--label')
    expect(createCall).toContain('bug')
  })

  it('includes body in create command', async () => {
    await createIssue(['--title', 'Test', '--body', 'Description here'])
    const createCall = mockRun.mock.calls[0][0]
    expect(createCall).toContain('--body')
    expect(createCall).toContain('Description here')
  })

  it('continues if project add fails', async () => {
    mockAddToProject.mockRejectedValue(new Error('project error'))
    await createIssue(['--title', 'Test', '--blocked-by', '10'])
    // Should still set dependencies
    expect(mockAddBlockedBy).toHaveBeenCalled()
  })
})
