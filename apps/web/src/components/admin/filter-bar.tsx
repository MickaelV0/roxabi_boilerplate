import { Button, Input, Label } from '@repo/ui'
import { RotateCcwIcon } from 'lucide-react'
import { useCallback, useRef } from 'react'

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

const DEBOUNCE_MS = 300

/**
 * FilterBar — reusable filter bar for admin list pages.
 *
 * Supports: dropdown select, searchable select, text search (debounced 300ms), date pickers.
 * Used by: users list, organizations list, audit logs list.
 */
export function FilterBar({ filters, values, onChange, onReset }: FilterBarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback(
    (key: string, value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onChange(key, value)
      }, DEBOUNCE_MS)
    },
    [onChange]
  )

  return (
    <div className="flex flex-wrap gap-3 py-4 items-end">
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-col gap-1.5">
          <Label
            htmlFor={`filter-${filter.key}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {filter.label}
          </Label>

          {(filter.type === 'select' || filter.type === 'searchable-select') && (
            <select
              id={`filter-${filter.key}`}
              value={values[filter.key] ?? ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <option value="">All</option>
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {filter.type === 'search' && (
            <Input
              id={`filter-${filter.key}`}
              type="text"
              placeholder={filter.placeholder ?? 'Search...'}
              value={values[filter.key] ?? ''}
              onChange={(e) => handleSearchChange(filter.key, e.target.value)}
              className="h-9 w-48"
            />
          )}

          {filter.type === 'date' && (
            <Input
              id={`filter-${filter.key}`}
              type="date"
              value={values[filter.key] ?? ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="h-9"
            />
          )}
        </div>
      ))}

      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
          <RotateCcwIcon className="size-3.5" />
          Reset
        </Button>
      )}
    </div>
  )
}

export type { FilterConfig, FilterBarProps }
