import { describe, it } from 'vitest'
import type { ThemeConfig } from './theme'

describe('hexToOklch', () => {
  it.todo('converts white hex to OKLch')
  it.todo('converts black hex to OKLch')
  it.todo('converts a saturated blue to OKLch')
  it.todo('handles shorthand hex (#fff)')
})

describe('oklchToHex', () => {
  it.todo('converts OKLch white to hex')
  it.todo('converts OKLch black to hex')
  it.todo('round-trips hex → OKLch → hex')
})

describe('contrastRatio', () => {
  it.todo('returns 21:1 for black on white')
  it.todo('returns 1:1 for same color')
  it.todo('returns a value between 1 and 21')
})

describe('meetsWcagAA', () => {
  it.todo('returns true for black text on white background')
  it.todo('returns false for low-contrast pair')
})

describe('deriveFullTheme', () => {
  // TODO: create a test ThemeConfig fixture
  const _testConfig: ThemeConfig = {
    name: 'Test',
    colors: {
      primary: 'oklch(0.62 0.21 264)',
      secondary: 'oklch(0.70 0.05 264)',
      accent: 'oklch(0.75 0.10 200)',
      destructive: 'oklch(0.55 0.22 27)',
      muted: 'oklch(0.87 0.01 264)',
      background: 'oklch(0.98 0.00 0)',
      foreground: 'oklch(0.15 0.00 0)',
      border: 'oklch(0.85 0.02 264)',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      baseFontSize: '16px',
    },
    radius: '0.625rem',
    shadows: 'subtle',
  }

  it.todo('returns light and dark variable sets')
  it.todo('derives foreground variants with sufficient contrast')
  it.todo('derives card/popover from background')
  it.todo('derives ring from border with alpha')
  it.todo('derives sidebar with ±0.03 lightness offset')
  it.todo('derives chart-1..5 with hue rotation')
  it.todo('mirrors lightness for dark mode')
})
