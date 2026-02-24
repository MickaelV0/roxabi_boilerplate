/**
 * Format an ISO timestamp as a relative time string (e.g., "2 hours ago", "3 days ago").
 * Returns "Never" for null/undefined inputs.
 */
export function formatRelativeTime(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return 'Never'

  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  return 'Just now'
}
