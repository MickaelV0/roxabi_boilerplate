/**
 * Secret redaction for finding content before storage.
 *
 * Best-effort defense: replaces common secret patterns with [REDACTED].
 * The transcripts themselves are already on disk unredacted, so this
 * is about preventing secrets from being indexed in the findings database.
 */

const REDACTION_PATTERNS: RegExp[] = [
  // API keys
  /(?:sk|pk|key|token|secret|password|api[_-]?key)[_-]?\w*[=:]\s*['"]?[\w\-.]{16,}/gi,
  // JWTs
  /eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g,
  // Connection strings
  /(?:postgres|mysql|mongodb|redis):\/\/[^\s'"]+/gi,
  // Base64 credentials
  /(?:Basic|Bearer)\s+[A-Za-z0-9+/]{20,}={0,2}/g,
]

/**
 * Redact secrets from a text string.
 *
 * @param text - The text to redact
 * @returns Redacted text with secrets replaced by [REDACTED]
 */
export function redact(text: string): string {
  let result = text
  for (const pattern of REDACTION_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

/**
 * Redact secrets from a finding's content and context fields.
 */
export function redactFinding(finding: { content: string; context?: string | null }): {
  content: string
  context: string | null
} {
  return {
    content: redact(finding.content),
    context: finding.context != null ? redact(finding.context) : null,
  }
}

export { REDACTION_PATTERNS }
