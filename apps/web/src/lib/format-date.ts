/**
 * Shared date formatting utilities for admin pages.
 *
 * Consolidates duplicated formatDate/formatTimestamp across:
 * - users list, user detail
 * - organizations list, org detail
 * - audit logs
 */

/** Format a date string or Date to a short date like "Jan 1, 2024" */
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Format a date string or Date to a timestamp like "Jan 1, 2024, 12:00:00 PM" */
export function formatTimestamp(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
