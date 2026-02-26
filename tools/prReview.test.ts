import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

describe('pr-review.yml', () => {
  const wf = parse(readFileSync('.github/workflows/pr-review.yml', 'utf-8'))
  const job = wf.jobs.review
  const claudeStep = job.steps.find((s: { uses?: string }) =>
    s.uses?.startsWith('anthropics/claude-code-action')
  )

  it('has fork guard', () => {
    expect(job.if).toContain('head.repo.full_name == github.repository')
  })

  it('has actor guard to prevent re-trigger on auto-fix commits', () => {
    expect(job.if).toContain("github.actor != 'github-actions[bot]'")
  })

  it('has cancel-in-progress concurrency', () => {
    expect(wf.concurrency['cancel-in-progress']).toBe(true)
  })

  it('has concurrency group keyed on PR number', () => {
    expect(wf.concurrency.group).toContain('pull_request.number')
  })

  it('has contents:write permission for auto-fix commits', () => {
    expect(job.permissions.contents).toBe('write')
  })

  it('has pull-requests:write permission', () => {
    expect(job.permissions['pull-requests']).toBe('write')
  })

  it('has issues:read permission', () => {
    expect(job.permissions.issues).toBe('read')
  })

  it('has id-token:write permission (required by claude-code-action for OIDC)', () => {
    expect(job.permissions?.['id-token']).toBe('write')
  })

  it('triggers on pull_request to main and staging branches', () => {
    expect(wf.on.pull_request.branches).toEqual(['main', 'staging'])
  })

  it('triggers on opened and synchronize pull_request types', () => {
    expect(wf.on.pull_request.types).toEqual(['opened', 'synchronize'])
  })

  it('has preflight step', () => {
    const preflight = job.steps.find((s: { id?: string }) => s.id === 'preflight')
    expect(preflight).toBeDefined()
  })

  it('preflight step checks 2000-line threshold', () => {
    const preflight = job.steps.find((s: { id?: string }) => s.id === 'preflight')
    expect(preflight.run).toContain('2000')
  })

  it('preflight step sets skip=true output', () => {
    const preflight = job.steps.find((s: { id?: string }) => s.id === 'preflight')
    expect(preflight.run).toContain('skip=true')
  })

  it('review step is gated on preflight skip output', () => {
    expect(claudeStep.if).toContain('preflight.outputs.skip')
  })

  it('uses OAuth token auth', () => {
    expect(claudeStep.with.claude_code_oauth_token).toContain('CLAUDE_CODE_OAUTH_TOKEN')
  })

  it('uses sticky comment', () => {
    expect(claudeStep.with.use_sticky_comment).toBe(true)
  })

  it('uses commit signing', () => {
    expect(claudeStep.with.use_commit_signing).toBe(true)
  })
})
