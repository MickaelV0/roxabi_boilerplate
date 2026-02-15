#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const BLOCKING_RULES = new Set(['hardcoded-secret', 'sql-injection', 'command-injection'])

const SECURITY_PATTERNS = [
  {
    id: 'github-actions-injection',
    pattern: /\$\{\{\s*github\.event\.(issue|pull_request|comment)\.body/gi,
    message: 'Potential GitHub Actions injection via untrusted input',
  },
  {
    id: 'dynamic-code-execution',
    pattern: /\beval\s*\(|\bnew\s+Function\s*\(/gi,
    message: 'Dynamic code execution detected (eval/new Function)',
  },
  {
    id: 'xss-innerhtml',
    pattern: /\.innerHTML\s*=|dangerouslySetInnerHTML/gi,
    message: 'Potential XSS vector via innerHTML/dangerouslySetInnerHTML',
  },
  {
    id: 'hardcoded-secret',
    pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    message: 'BLOCKED: Potential hardcoded secret detected',
  },
  {
    id: 'sql-injection',
    pattern: /`SELECT.*\$\{|`INSERT.*\$\{|`UPDATE.*\$\{|`DELETE.*\$\{/gi,
    message: 'BLOCKED: Potential SQL injection via template literal interpolation',
  },
  {
    id: 'command-injection',
    pattern: /exec\s*\(\s*`|spawn\s*\(\s*`|execSync\s*\(\s*`/gi,
    message: 'BLOCKED: Potential command injection via template literal',
  },
]

const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const STATE_DIR = path.resolve(__dirname, '..', 'security_warnings')
const today = new Date().toISOString().slice(0, 10)
const STATE_FILE = path.join(STATE_DIR, `${today}.json`)

function pruneOldStateFiles() {
  const MAX_AGE_DAYS = 7
  try {
    const files = fs.readdirSync(STATE_DIR)
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const filePath = path.join(STATE_DIR, file)
      const stat = fs.statSync(filePath)
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath)
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return { warnings: {} }
  }
}

function saveState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

function toRelativePath(filePath) {
  return path.relative(PROJECT_ROOT, filePath) || filePath
}

function getWarningKey(file, ruleId) {
  return `${toRelativePath(file)}:${ruleId}`
}

function checkContent(content, filePath) {
  const state = loadState()
  const warnings = []
  const blocked = []

  for (const rule of SECURITY_PATTERNS) {
    if (rule.pattern.test(content)) {
      const key = getWarningKey(filePath, rule.id)
      if (!state.warnings[key]) {
        if (BLOCKING_RULES.has(rule.id)) {
          blocked.push(rule.message)
        } else {
          warnings.push(rule.message)
        }
        state.warnings[key] = Date.now()
      }
    }
    rule.pattern.lastIndex = 0
  }

  saveState(state)
  return { warnings, blocked }
}

function main() {
  pruneOldStateFiles()

  const input = process.env.CLAUDE_TOOL_INPUT
  if (!input) {
    process.exit(0)
  }

  try {
    const toolInput = JSON.parse(input)
    const content = toolInput.content || toolInput.new_string || ''
    const filePath = toolInput.file_path || 'unknown'

    if (!content) {
      process.exit(0)
    }

    const { warnings, blocked } = checkContent(content, filePath)
    const allMessages = [...blocked, ...warnings]

    if (allMessages.length > 0) {
      console.log(
        JSON.stringify({
          decision: blocked.length > 0 ? 'block' : 'allow',
          message: `Security check:\n${allMessages.map((w) => `- ${w}`).join('\n')}`,
        })
      )
    }
  } catch {
    process.exit(0)
  }
}

main()
