/** Sensitive fields that are redacted client-side as defense-in-depth */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordhash',
  'token',
  'secret',
  'accesstoken',
  'refreshtoken',
  'idtoken',
] as const

type DiffViewerProps = {
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

/**
 * DiffViewer — before/after diff view for audit log entries.
 *
 * Shows changed fields side-by-side with highlighting.
 * Applies client-side redaction of sensitive fields as defense-in-depth
 * (backend also redacts — this is a safety net).
 */
export function DiffViewer({ before: _before, after: _after }: DiffViewerProps) {
  // TODO: implement — diff view with:
  // - Side-by-side or inline before/after display
  // - Changed fields highlighted
  // - Sensitive fields redacted as [REDACTED] (case-insensitive key match)
  // - Null values handled gracefully
  return <div>TODO: DiffViewer</div>
}

/**
 * Redact sensitive fields from an audit log data object.
 * Case-insensitive key matching. Returns a new object with redacted values.
 */
export function redactSensitiveFields(
  data: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!data) return null
  // TODO: implement — replace values for keys matching SENSITIVE_FIELDS with '[REDACTED]'
  return data
}
