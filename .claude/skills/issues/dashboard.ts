#!/usr/bin/env bun
/**
 * Issues Dashboard — local dev tool
 * Usage: bun .claude/skills/issues/dashboard.ts [--port=3333]
 *
 * Serves a live HTML dashboard of GitHub project issues.
 * Data refreshes on every page load (browser refresh).
 */

import { fetchBranches, fetchIssues, fetchPRs, fetchWorktrees } from './lib/fetch'
import { buildHtml } from './lib/page'
import { handleUpdate } from './lib/update'

const PORT = Number(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? 3333)
const PID_FILE = `${import.meta.dirname}/.dashboard.pid`

// Write PID file for lifecycle management
await Bun.write(PID_FILE, String(process.pid))
process.on('SIGINT', () => {
  try {
    require('node:fs').unlinkSync(PID_FILE)
  } catch {}
  process.exit(0)
})
process.on('SIGTERM', () => {
  try {
    require('node:fs').unlinkSync(PID_FILE)
  } catch {}
  process.exit(0)
})

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/api/update' && req.method === 'POST') {
      return handleUpdate(req)
    }

    try {
      const start = performance.now()
      const [issues, prs, branches, worktrees] = await Promise.all([
        fetchIssues(),
        fetchPRs(),
        fetchBranches(),
        fetchWorktrees(),
      ])
      const fetchMs = Math.round(performance.now() - start)
      const html = buildHtml(issues, prs, branches, worktrees, fetchMs)
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(
        `<pre style="color:red;padding:20px;">Error fetching issues:\n${msg}</pre>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      )
    }
  },
})

console.log(`\n  Issues Dashboard \u2192 http://localhost:${server.port}\n`)
