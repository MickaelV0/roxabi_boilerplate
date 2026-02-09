// TODO: implement — import color conversion helpers
// import { hexToOklch, oklchToHex, meetsWcagAA } from '@repo/ui'

interface ColorPickerProps {
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
export function ColorPicker(_props: ColorPickerProps) {
  // TODO: implement
  // 1. Convert OKLch value to hex for the native color picker
  // 2. On picker change: convert hex to OKLch → call onChange
  // 3. Display hex and OKLch values
  // 4. If contrastAgainst provided, compute contrast ratio and show indicator

  return (
    <div>
      <p>ColorPicker — scaffold placeholder</p>
    </div>
  )
}
