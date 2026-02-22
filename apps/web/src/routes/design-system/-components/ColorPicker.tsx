import { Badge, cn, hexToOklch, meetsWcagAA, oklchToHex } from '@repo/ui'
import { useMemo } from 'react'
import { m } from '@/paraglide/messages'

type ColorPickerProps = {
  /** Semantic token name (e.g., "Primary", "Secondary") */
  label: string
  /** Current value in OKLch format */
  value: string
  /** Callback with new OKLch value */
  onChange: (oklchValue: string) => void
  /** Optional: background color to check contrast against */
  contrastAgainst?: string
}

/**
 * Color picker with hex input and OKLch conversion.
 *
 * Displays:
 * - Native hex color picker input
 * - Hex value text display
 * - OKLch value text display
 * - Optional WCAG AA contrast indicator (warning icon if fails 4.5:1)
 *
 * Accessibility:
 * - aria-label with token name (e.g., "Primary color")
 * - Keyboard operable
 */
export function ColorPicker({ label, value, onChange, contrastAgainst }: ColorPickerProps) {
  const hexValue = useMemo(() => {
    try {
      return oklchToHex(value)
    } catch {
      return '#000000'
    }
  }, [value])

  const passesContrast = useMemo(() => {
    if (!contrastAgainst) return
    try {
      return meetsWcagAA(value, contrastAgainst)
    } catch {
      return
    }
  }, [value, contrastAgainst])

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const oklch = hexToOklch(e.target.value)
      onChange(oklch)
    } catch {
      // Ignore invalid hex values from the picker
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label
        className="group relative flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border shadow-sm"
        aria-label={m.ds_color_aria({ label })}
      >
        <input
          type="color"
          value={hexValue}
          onChange={handleColorChange}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={m.ds_color_picker_aria({ label })}
        />
        <span className="block size-full rounded-md" style={{ backgroundColor: hexValue }} />
      </label>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {passesContrast !== undefined && (
            <Badge
              variant={passesContrast ? 'secondary' : 'destructive'}
              className="text-[10px] leading-none"
            >
              {passesContrast ? m.ds_contrast_pass() : m.ds_contrast_fail()}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <code className="text-xs text-muted-foreground">{hexValue}</code>
          <span className="text-muted-foreground/40" aria-hidden="true">
            /
          </span>
          <code
            className={cn('max-w-[160px] truncate text-xs text-muted-foreground')}
            title={value}
          >
            {value}
          </code>
        </div>
      </div>
    </div>
  )
}
