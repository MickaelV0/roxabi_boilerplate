#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

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
    message: 'Potential hardcoded secret detected',
  },
  {
    id: 'sql-injection',
    pattern: /`SELECT.*\$\{|`INSERT.*\$\{|`UPDATE.*\$\{|`DELETE.*\$\{/gi,
    message: 'Potential SQL injection via template literal interpolation',
  },
  {
    id: 'command-injection',
    pattern: /exec\s*\(\s*`|spawn\s*\(\s*`|execSync\s*\(\s*`/gi,
    message: 'Potential command injection via template literal',
  },
]

const STATE_FILE = path.join(process.env.HOME || '/tmp', '.claude-security-warnings.json')

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return { warnings: {} }
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

function getWarningKey(file, ruleId) {
  return `${file}:${ruleId}`
}

function checkContent(content, filePath) {
  const state = loadState()
  const warnings = []

  for (const rule of SECURITY_PATTERNS) {
    if (rule.pattern.test(content)) {
      const key = getWarningKey(filePath, rule.id)
      if (!state.warnings[key]) {
        warnings.push(rule.message)
        state.warnings[key] = Date.now()
      }
    }
    rule.pattern.lastIndex = 0
  }

  saveState(state)
  return warnings
}

function main() {
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

    const warnings = checkContent(content, filePath)

    if (warnings.length > 0) {
      console.log(
        JSON.stringify({
          decision: 'allow',
          message: `Security warnings:\n${warnings.map((w) => `- ${w}`).join('\n')}`,
        })
      )
    }
  } catch {
    process.exit(0)
  }
}

main()
