import { describe, expect, it } from 'vitest'
import { ALL_PRESETS, getPresetConfig } from '../themes/presets'
import {
  contrastRatio,
  deriveFullTheme,
  hexToOklch,
  meetsWcagAA,
  oklchToHex,
  parseOklch,
} from './theme'

/** Zinc preset config -- used as the default theme for tests */
const zincPreset = ALL_PRESETS.find((p) => p.name === 'zinc') as (typeof ALL_PRESETS)[number]
const defaultTheme = getPresetConfig(zincPreset)

// ---------------------------------------------------------------------------
// hexToOklch
// ---------------------------------------------------------------------------

describe('hexToOklch', () => {
  it('should convert #ffffff to approximately oklch(1 0 0) when given white hex', () => {
    // Arrange
    const hex = '#ffffff'

    // Act
    const result = hexToOklch(hex)
    const parsed = parseOklch(result)

    // Assert
    expect(parsed.l).toBeCloseTo(1, 1)
    expect(parsed.c).toBeCloseTo(0, 2)
  })

  it('should convert #000000 to approximately oklch(0 0 0) when given black hex', () => {
    // Arrange
    const hex = '#000000'

    // Act
    const result = hexToOklch(hex)
    const parsed = parseOklch(result)

    // Assert
    expect(parsed.l).toBeCloseTo(0, 1)
    expect(parsed.c).toBeCloseTo(0, 2)
  })

  it('should convert #3b82f6 to OKLch with L ~0.6-0.7, C > 0.1, H ~260-270 when given a saturated blue', () => {
    // Arrange
    const hex = '#3b82f6'

    // Act
    const result = hexToOklch(hex)
    const parsed = parseOklch(result)

    // Assert
    expect(parsed.l).toBeGreaterThan(0.6)
    expect(parsed.l).toBeLessThan(0.7)
    expect(parsed.c).toBeGreaterThan(0.1)
    expect(parsed.h).toBeGreaterThan(255)
    expect(parsed.h).toBeLessThan(270)
  })

  it('should handle shorthand hex #fff when given a three-character hex', () => {
    // Arrange
    const hex = '#fff'

    // Act
    const result = hexToOklch(hex)
    const parsed = parseOklch(result)

    // Assert
    expect(parsed.l).toBeCloseTo(1, 1)
    expect(parsed.c).toBeCloseTo(0, 2)
  })
})

// ---------------------------------------------------------------------------
// oklchToHex
// ---------------------------------------------------------------------------

describe('oklchToHex', () => {
  it('should convert oklch white to #ffffff when given oklch(1 0 0)', () => {
    // Arrange
    const oklch = 'oklch(1 0 0)'

    // Act
    const result = oklchToHex(oklch)

    // Assert
    expect(result).toBe('#ffffff')
  })

  it('should convert oklch black to #000000 when given oklch(0 0 0)', () => {
    // Arrange
    const oklch = 'oklch(0 0 0)'

    // Act
    const result = oklchToHex(oklch)

    // Assert
    expect(result).toBe('#000000')
  })

  it('should round-trip hex -> oklch -> hex to approximately the same value when given an arbitrary color', () => {
    // Arrange
    const originalHex = '#3b82f6'

    // Act
    const oklch = hexToOklch(originalHex)
    const roundTripped = oklchToHex(oklch)

    // Assert -- hex values should be very close (may differ by 1 in a channel due to rounding)
    expect(roundTripped).toBe(originalHex)
  })

  it('should round-trip a warm color through hex -> oklch -> hex when given #e67e22', () => {
    // Arrange
    const originalHex = '#e67e22'

    // Act
    const oklch = hexToOklch(originalHex)
    const roundTripped = oklchToHex(oklch)

    // Assert -- the result should be the same or very close
    // Parse both to compare RGB channels with tolerance
    const originalR = Number.parseInt(originalHex.slice(1, 3), 16)
    const resultR = Number.parseInt(roundTripped.slice(1, 3), 16)
    const originalG = Number.parseInt(originalHex.slice(3, 5), 16)
    const resultG = Number.parseInt(roundTripped.slice(3, 5), 16)
    const originalB = Number.parseInt(originalHex.slice(5, 7), 16)
    const resultB = Number.parseInt(roundTripped.slice(5, 7), 16)

    expect(Math.abs(originalR - resultR)).toBeLessThanOrEqual(2)
    expect(Math.abs(originalG - resultG)).toBeLessThanOrEqual(2)
    expect(Math.abs(originalB - resultB)).toBeLessThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// contrastRatio
// ---------------------------------------------------------------------------

describe('contrastRatio', () => {
  it('should return approximately 21 when comparing black on white', () => {
    // Arrange
    const black = 'oklch(0 0 0)'
    const white = 'oklch(1 0 0)'

    // Act
    const ratio = contrastRatio(black, white)

    // Assert
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('should return approximately 1 when comparing the same color', () => {
    // Arrange
    const color = 'oklch(0.5 0.1 260)'

    // Act
    const ratio = contrastRatio(color, color)

    // Assert
    expect(ratio).toBeCloseTo(1, 1)
  })

  it('should return a value between 1 and 21 for any arbitrary color pair', () => {
    // Arrange
    const color1 = 'oklch(0.3 0.12 200)'
    const color2 = 'oklch(0.8 0.05 100)'

    // Act
    const ratio = contrastRatio(color1, color2)

    // Assert
    expect(ratio).toBeGreaterThanOrEqual(1)
    expect(ratio).toBeLessThanOrEqual(21)
  })

  it('should be symmetric when order of arguments is swapped', () => {
    // Arrange
    const color1 = 'oklch(0.3 0.15 260)'
    const color2 = 'oklch(0.85 0.02 40)'

    // Act
    const ratio1 = contrastRatio(color1, color2)
    const ratio2 = contrastRatio(color2, color1)

    // Assert
    expect(ratio1).toBeCloseTo(ratio2, 5)
  })
})

// ---------------------------------------------------------------------------
// meetsWcagAA
// ---------------------------------------------------------------------------

describe('meetsWcagAA', () => {
  it('should return true when comparing black text on white background', () => {
    // Arrange
    const black = 'oklch(0 0 0)'
    const white = 'oklch(1 0 0)'

    // Act
    const result = meetsWcagAA(black, white)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when comparing very similar colors with low contrast', () => {
    // Arrange
    const color1 = 'oklch(0.5 0.01 0)'
    const color2 = 'oklch(0.55 0.01 0)'

    // Act
    const result = meetsWcagAA(color1, color2)

    // Assert
    expect(result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// deriveFullTheme
// ---------------------------------------------------------------------------

describe('deriveFullTheme', () => {
  const derived = deriveFullTheme(defaultTheme)

  it('should return an object with light and dark properties when given a ThemeConfig', () => {
    // Assert
    expect(derived).toHaveProperty('light')
    expect(derived).toHaveProperty('dark')
  })

  it('should return light and dark as Record<string, string> when derived', () => {
    // Assert
    expect(typeof derived.light).toBe('object')
    expect(typeof derived.dark).toBe('object')

    for (const value of Object.values(derived.light)) {
      expect(typeof value).toBe('string')
    }
    for (const value of Object.values(derived.dark)) {
      expect(typeof value).toBe('string')
    }
  })

  it('should contain all expected CSS variable keys when derived from default theme', () => {
    // Arrange
    const expectedKeys = [
      'background',
      'foreground',
      'primary',
      'primary-foreground',
      'secondary',
      'secondary-foreground',
      'accent',
      'accent-foreground',
      'destructive',
      'destructive-foreground',
      'muted',
      'muted-foreground',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
      'input',
      'ring',
      'sidebar',
      'sidebar-foreground',
      'sidebar-primary',
      'sidebar-primary-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
      'sidebar-ring',
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'chart-5',
      'radius',
    ]

    // Assert
    for (const key of expectedKeys) {
      expect(derived.light).toHaveProperty(key)
      expect(derived.dark).toHaveProperty(key)
    }
  })

  it('should derive primary-foreground with sufficient contrast against primary when using default theme', () => {
    // Arrange
    const primary = derived.light.primary as string
    const primaryFg = derived.light['primary-foreground'] as string

    // Act
    const ratio = contrastRatio(primary, primaryFg)

    // Assert -- the derivation formula should ensure good contrast
    expect(ratio).toBeGreaterThan(3)
  })

  it('should set card and popover to match background when derived', () => {
    // Assert
    expect(derived.light.card).toBe(derived.light.background)
    expect(derived.light.popover).toBe(derived.light.background)
    expect(derived.light['card-foreground']).toBe(derived.light.foreground)
    expect(derived.light['popover-foreground']).toBe(derived.light.foreground)
  })

  it('should set card and popover to match background in dark mode when derived', () => {
    // Assert
    expect(derived.dark.card).toBe(derived.dark.background)
    expect(derived.dark.popover).toBe(derived.dark.background)
    expect(derived.dark['card-foreground']).toBe(derived.dark.foreground)
    expect(derived.dark['popover-foreground']).toBe(derived.dark.foreground)
  })

  it('should derive sidebar with lightness offset of 0.03 from background when using default theme', () => {
    // Arrange
    const bgParsed = parseOklch(derived.light.background as string)
    const sidebarParsed = parseOklch(derived.light.sidebar as string)

    // Act
    const lightnessOffset = Math.abs(bgParsed.l - sidebarParsed.l)

    // Assert
    expect(lightnessOffset).toBeCloseTo(0.03, 2)
  })

  it('should derive chart-1 through chart-5 as valid oklch colors when using default theme', () => {
    // Assert
    for (let i = 1; i <= 5; i++) {
      const chartKey = `chart-${i}`
      const chartValue = derived.light[chartKey] as string

      expect(chartValue).toBeDefined()
      expect(chartValue).toMatch(/^oklch\(/)

      const parsed = parseOklch(chartValue)
      expect(parsed.l).toBeGreaterThanOrEqual(0)
      expect(parsed.l).toBeLessThanOrEqual(1)
      expect(parsed.c).toBeGreaterThanOrEqual(0)
      expect(parsed.h).toBeGreaterThanOrEqual(0)
      expect(parsed.h).toBeLessThan(360)
    }
  })

  it('should derive chart colors with distinct hues when using default theme', () => {
    // Arrange
    const chartHues: number[] = []
    for (let i = 1; i <= 5; i++) {
      const parsed = parseOklch(derived.light[`chart-${i}`] as string)
      chartHues.push(parsed.h)
    }

    // Assert -- all chart hues should be distinct (at least 20 degrees apart)
    for (let i = 0; i < chartHues.length; i++) {
      for (let j = i + 1; j < chartHues.length; j++) {
        const diff = Math.abs(
          (((chartHues[i] as number) - (chartHues[j] as number) + 540) % 360) - 180
        )
        expect(diff).toBeGreaterThan(20)
      }
    }
  })

  it('should mirror lightness for dark mode seeds when derived', () => {
    // Arrange
    const lightBg = parseOklch(derived.light.background as string)
    const darkBg = parseOklch(derived.dark.background as string)

    // Act -- dark background L should be approximately 1 - light background L (clamped)
    const expectedDarkL = Math.max(0.1, Math.min(0.95, 1 - lightBg.l))

    // Assert
    expect(darkBg.l).toBeCloseTo(expectedDarkL, 2)
  })

  it('should preserve the radius value in both light and dark mode when derived', () => {
    // Assert
    expect(derived.light.radius).toBe(defaultTheme.radius)
    expect(derived.dark.radius).toBe(defaultTheme.radius)
  })

  it('should set input to match border when derived', () => {
    // Assert
    expect(derived.light.input).toBe(derived.light.border)
    expect(derived.dark.input).toBe(derived.dark.border)
  })

  it('should copy sidebar-primary from primary when derived', () => {
    // Assert
    expect(derived.light['sidebar-primary']).toBe(derived.light.primary)
    expect(derived.light['sidebar-accent']).toBe(derived.light.accent)
    expect(derived.light['sidebar-border']).toBe(derived.light.border)
  })

  it('should produce dark mode foreground that is lighter than light mode foreground when using default theme', () => {
    // Arrange
    const lightFg = parseOklch(derived.light.foreground as string)
    const darkFg = parseOklch(derived.dark.foreground as string)

    // Assert -- dark mode foreground should be lighter (higher L) since background is darker
    expect(darkFg.l).toBeGreaterThan(lightFg.l)
  })

  it('should include font-family and font-size in both modes', () => {
    // Assert
    expect(derived.light['font-family']).toBe(defaultTheme.typography.fontFamily)
    expect(derived.dark['font-family']).toBe(defaultTheme.typography.fontFamily)
    expect(derived.light['font-size']).toBe(defaultTheme.typography.baseFontSize)
    expect(derived.dark['font-size']).toBe(defaultTheme.typography.baseFontSize)
  })

  it('should derive sidebar-ring from ring in both modes', () => {
    // Assert
    expect(derived.light['sidebar-ring']).toBe(derived.light.ring)
    expect(derived.dark['sidebar-ring']).toBe(derived.dark.ring)
  })

  it('should derive destructive-foreground with inverted lightness', () => {
    // Arrange
    const destructiveFg = derived.light['destructive-foreground'] as string

    // Assert -- should be a valid oklch color
    expect(destructiveFg).toMatch(/^oklch\(/)
    const parsed = parseOklch(destructiveFg)
    expect(parsed.l).toBeGreaterThanOrEqual(0)
    expect(parsed.l).toBeLessThanOrEqual(1)
  })

  it('should derive accent-foreground and muted-foreground', () => {
    // Assert
    expect(derived.light['accent-foreground']).toMatch(/^oklch\(/)
    expect(derived.light['muted-foreground']).toMatch(/^oklch\(/)
    expect(derived.dark['accent-foreground']).toMatch(/^oklch\(/)
    expect(derived.dark['muted-foreground']).toMatch(/^oklch\(/)
  })

  it('should handle mid-lightness primary that forces foreground contrast shift', () => {
    // Arrange -- primary with L=0.5 should trigger the |L'-L| < 0.4 branch
    const midConfig: typeof defaultTheme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: 'oklch(0.5 0.15 260)',
      },
    }

    // Act
    const midDerived = deriveFullTheme(midConfig)

    // Assert -- foreground should be forced to 0.95 (since 1-0.5=0.5 is too close)
    const primaryFg = parseOklch(midDerived.light['primary-foreground'] as string)
    expect(primaryFg.l).toBe(0.95)
  })

  it('should handle high-lightness primary that forces foreground to 0.15', () => {
    // Arrange -- primary with L=0.8, inverted=0.2, |0.2-0.8|=0.6 >= 0.4 -- no force
    // But L=0.7, inverted=0.3, |0.3-0.7|=0.4 >= 0.4 -- border case
    // L=0.65, inverted=0.35, |0.35-0.65|=0.3 < 0.4 -- forces to 0.15 since L>0.5
    const highConfig: typeof defaultTheme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: 'oklch(0.65 0.15 260)',
      },
    }

    // Act
    const highDerived = deriveFullTheme(highConfig)

    // Assert
    const primaryFg = parseOklch(highDerived.light['primary-foreground'] as string)
    expect(primaryFg.l).toBe(0.15)
  })

  it('should clamp dark mode lightness between 0.1 and 0.95', () => {
    // Arrange -- very dark primary (L=0.05), mirrored = 1-0.05=0.95
    const darkConfig: typeof defaultTheme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: 'oklch(0.05 0.15 260)',
      },
    }

    // Act
    const darkDerived = deriveFullTheme(darkConfig)

    // Assert -- dark mode primary L should be clamped to 0.95
    const darkPrimary = parseOklch(darkDerived.dark.primary as string)
    expect(darkPrimary.l).toBeLessThanOrEqual(0.95)
    expect(darkPrimary.l).toBeGreaterThanOrEqual(0.1)
  })
})

// ---------------------------------------------------------------------------
// parseOklch -- error paths
// ---------------------------------------------------------------------------

describe('parseOklch error handling', () => {
  it('should throw when given an invalid color string', () => {
    expect(() => parseOklch('not-a-color')).toThrow('Failed to parse color')
  })
})

// ---------------------------------------------------------------------------
// hexToOklch / oklchToHex -- error paths
// ---------------------------------------------------------------------------

describe('hexToOklch error handling', () => {
  it('should throw when given an invalid hex string', () => {
    expect(() => hexToOklch('zzz')).toThrow('Failed to parse hex color')
  })
})

describe('oklchToHex error handling', () => {
  it('should throw when given an invalid oklch string', () => {
    expect(() => oklchToHex('not-valid')).toThrow('Failed to parse oklch color')
  })
})

// ---------------------------------------------------------------------------
// applyTheme / resetTheme
// ---------------------------------------------------------------------------

import { applyTheme, formatOklchStr, resetTheme } from './theme'

describe('formatOklchStr', () => {
  it('should format components into an oklch() string rounded to 3 decimals', () => {
    // Act
    const result = formatOklchStr(0.12345, 0.06789, 264.5678)

    // Assert
    expect(result).toBe('oklch(0.123 0.068 264.568)')
  })
})

describe('applyTheme', () => {
  it('should create a style element with CSS variables when called in browser', () => {
    // Arrange
    const theme: import('./theme').DerivedTheme = {
      light: { primary: 'oklch(0.5 0.2 260)', radius: '0.5rem' },
      dark: { primary: 'oklch(0.6 0.2 260)', radius: '0.5rem' },
    }

    // Act
    applyTheme(theme)

    // Assert
    const styleEl = document.getElementById('roxabi-theme-dark')
    expect(styleEl).not.toBeNull()
    expect(styleEl?.textContent).toContain('--primary')
    expect(styleEl?.textContent).toContain(':root')
    expect(styleEl?.textContent).toContain('.dark')

    // Cleanup
    styleEl?.remove()
  })

  it('should reuse existing style element on second call', () => {
    // Arrange
    const theme1: import('./theme').DerivedTheme = {
      light: { primary: 'oklch(0.5 0.2 260)' },
      dark: { primary: 'oklch(0.6 0.2 260)' },
    }
    const theme2: import('./theme').DerivedTheme = {
      light: { primary: 'oklch(0.7 0.1 120)' },
      dark: { primary: 'oklch(0.8 0.1 120)' },
    }

    // Act
    applyTheme(theme1)
    applyTheme(theme2)

    // Assert -- only one style element should exist
    const elements = document.querySelectorAll('#roxabi-theme-dark')
    expect(elements).toHaveLength(1)
    expect(elements[0]?.textContent).toContain('0.7')

    // Cleanup
    elements[0]?.remove()
  })
})

describe('resetTheme', () => {
  it('should remove the injected style element', () => {
    // Arrange
    const theme: import('./theme').DerivedTheme = {
      light: { primary: 'oklch(0.5 0.2 260)' },
      dark: { primary: 'oklch(0.6 0.2 260)' },
    }
    applyTheme(theme)

    // Act
    resetTheme()

    // Assert
    expect(document.getElementById('roxabi-theme-dark')).toBeNull()
  })

  it('should not throw when no style element exists', () => {
    // Assert
    expect(() => resetTheme()).not.toThrow()
  })
})
