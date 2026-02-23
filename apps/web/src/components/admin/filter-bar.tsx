type FilterConfig = {
  key: string
  label: string
  type: 'select' | 'search' | 'date' | 'searchable-select'
  options?: { value: string; label: string }[]
  placeholder?: string
}

type FilterBarProps = {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onReset?: () => void
}

/**
 * FilterBar — reusable filter bar for admin list pages.
 *
 * Supports: dropdown select, searchable select, text search (debounced 300ms), date pickers.
 * Used by: users list, organizations list, audit logs list.
 */
export function FilterBar({
  filters: _filters,
  values: _values,
  onChange: _onChange,
  onReset: _onReset,
}: FilterBarProps) {
  // TODO: implement — horizontal filter bar with:
  // - Select dropdowns for enum filters
  // - Searchable select for user/org lookups
  // - Debounced text input for search (300ms)
  // - Date pickers for date range
  // - Reset button
  return <div className="flex flex-wrap gap-3 py-4">TODO: FilterBar</div>
}
