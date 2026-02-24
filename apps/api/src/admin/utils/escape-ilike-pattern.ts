/**
 * Escape special ILIKE pattern characters (%, _, \) in user search input.
 */
export function escapeIlikePattern(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}
