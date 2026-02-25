import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui'
import { RotateCcwIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
const ALL_SENTINEL = '__all__'

function DebouncedSearchInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setLocalValue(newValue)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(newValue), DEBOUNCE_MS)
  }

  return (
    <Input
      id={id}
      type="text"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      className="h-9 w-48"
    />
  )
}

/**
 * FilterBar — reusable filter bar for admin list pages.
 *
 * Supports: dropdown select, searchable select, text search (debounced 300ms), date pickers.
 * Used by: users list, organizations list, audit logs list.
 */
export function FilterBar({ filters, values, onChange, onReset }: FilterBarProps) {
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
            <Select
              value={values[filter.key] || ALL_SENTINEL}
              onValueChange={(val) => onChange(filter.key, val === ALL_SENTINEL ? '' : val)}
            >
              <SelectTrigger id={`filter-${filter.key}`} className="h-9 w-[180px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>All</SelectItem>
                {filter.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filter.type === 'search' && (
            <DebouncedSearchInput
              id={`filter-${filter.key}`}
              placeholder={filter.placeholder ?? 'Search...'}
              value={values[filter.key] ?? ''}
              onChange={(val) => onChange(filter.key, val)}
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
