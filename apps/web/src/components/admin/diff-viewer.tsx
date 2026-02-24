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

type DiffLine = {
  key: string
  type: 'added' | 'removed' | 'changed' | 'unchanged'
  oldValue?: string
  newValue?: string
}

/**
 * Redact sensitive fields from an audit log data object.
 * Case-insensitive key matching. Returns a new object with redacted values.
 */
export function redactSensitiveFields(
  data: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!data) return null
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '')
    if (SENSITIVE_FIELDS.some((field) => normalizedKey.includes(field))) {
      result[key] = '[REDACTED]'
    } else {
      result[key] = value
    }
  }
  return result
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined'
  return JSON.stringify(value)
}

function classifyKey(
  key: string,
  redactedBefore: Record<string, unknown> | null,
  redactedAfter: Record<string, unknown> | null
): DiffLine {
  const inBefore = redactedBefore ? key in redactedBefore : false
  const inAfter = redactedAfter ? key in redactedAfter : false
  const oldVal = redactedBefore?.[key]
  const newVal = redactedAfter?.[key]

  if (inBefore && !inAfter) {
    return { key, type: 'removed', oldValue: formatValue(oldVal) }
  }
  if (!inBefore && inAfter) {
    return { key, type: 'added', newValue: formatValue(newVal) }
  }
  if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
    return { key, type: 'changed', oldValue: formatValue(oldVal), newValue: formatValue(newVal) }
  }
  return { key, type: 'unchanged', oldValue: formatValue(oldVal), newValue: formatValue(oldVal) }
}

function computeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): DiffLine[] {
  const redactedBefore = redactSensitiveFields(before)
  const redactedAfter = redactSensitiveFields(after)

  const beforeKeys = redactedBefore ? Object.keys(redactedBefore) : []
  const afterKeys = redactedAfter ? Object.keys(redactedAfter) : []
  const allKeys = [...new Set([...beforeKeys, ...afterKeys])].sort()

  return allKeys.map((key) => classifyKey(key, redactedBefore, redactedAfter))
}

/**
 * DiffViewer — before/after diff view for audit log entries.
 *
 * Shows changed fields with highlighting.
 * Applies client-side redaction of sensitive fields as defense-in-depth
 * (backend also redacts — this is a safety net).
 */
export function DiffViewer({ before, after }: DiffViewerProps) {
  if (!(before || after)) {
    return <div className="px-4 py-3 text-sm text-muted-foreground italic">No changes recorded</div>
  }

  const lines = computeDiff(before, after)

  if (lines.length === 0) {
    return <div className="px-4 py-3 text-sm text-muted-foreground italic">No changes recorded</div>
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Field</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">
              Before
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">After</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.key} className="border-b border-border last:border-b-0">
              <td className="px-3 py-1.5 font-medium text-foreground text-xs">{line.key}</td>

              {line.type === 'removed' && (
                <>
                  <td className="px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    <span className="line-through">{line.oldValue}</span>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground italic text-xs">&mdash;</td>
                </>
              )}

              {line.type === 'added' && (
                <>
                  <td className="px-3 py-1.5 text-muted-foreground italic text-xs">&mdash;</td>
                  <td className="px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                    {line.newValue}
                  </td>
                </>
              )}

              {line.type === 'changed' && (
                <>
                  <td className="px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    <span className="line-through">{line.oldValue}</span>
                  </td>
                  <td className="px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                    {line.newValue}
                  </td>
                </>
              )}

              {line.type === 'unchanged' && (
                <>
                  <td className="px-3 py-1.5 text-muted-foreground text-xs">{line.oldValue}</td>
                  <td className="px-3 py-1.5 text-muted-foreground text-xs">{line.newValue}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
