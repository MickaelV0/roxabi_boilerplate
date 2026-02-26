import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

describe('pr-review.yml', () => {
  const wf = parse(readFileSync('.github/workflows/pr-review.yml', 'utf-8'))
  const job = wf.jobs.review

  it('has fork guard', () => {
    expect(job.if).toContain('head.repo.full_name == github.repository')
  })
  it('has cancel-in-progress concurrency', () => {
    expect(wf.concurrency['cancel-in-progress']).toBe(true)
  })
  it('has contents:write permission for auto-fix commits', () => {
    expect(wf.permissions.contents).toBe('write')
  })
  it('has id-token:write for OIDC commit signing', () => {
    expect(wf.permissions['id-token']).toBe('write')
  })
  it('uses OAuth token auth', () => {
    const step = job.steps.find((s: { uses?: string }) =>
      s.uses?.startsWith('anthropics/claude-code-action')
    )
    expect(step.with.claude_code_oauth_token).toContain('CLAUDE_CODE_OAUTH_TOKEN')
  })
  it('has [skip ci] in prompt to prevent re-trigger loop', () => {
    const step = job.steps.find((s: { uses?: string }) =>
      s.uses?.startsWith('anthropics/claude-code-action')
    )
    expect(step.with.prompt).toContain('[skip ci]')
  })
})
