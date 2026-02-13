import { describe, expect, it } from 'vitest'
import type { ShadcnPreset } from './presets'
import {
  ALL_PRESETS,
  BASE_PRESETS,
  COLOR_PRESETS,
  getComposedConfig,
  getComposedDerivedTheme,
  getPresetConfig,
  getPresetDerivedTheme,
} from './presets'

// ---------------------------------------------------------------------------
// Required CSS variable keys for a complete theme
// ---------------------------------------------------------------------------

const REQUIRED_KEYS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'radius',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
]

// ---------------------------------------------------------------------------
// Preset collection structure
// ---------------------------------------------------------------------------

describe('preset collections', () => {
  it('should have exactly 4 base presets', () => {
    expect(BASE_PRESETS).toHaveLength(4)
  })

  it('should have exactly 17 color presets', () => {
    expect(COLOR_PRESETS).toHaveLength(17)
  })

  it('should combine to 21 total presets in ALL_PRESETS', () => {
    expect(ALL_PRESETS).toHaveLength(21)
  })

  it('should have unique names across all presets', () => {
    // Arrange
    const names = ALL_PRESETS.map((p) => p.name)

    // Assert
    expect(new Set(names).size).toBe(names.length)
  })

  it('should tag all base presets with group "base"', () => {
    for (const preset of BASE_PRESETS) {
      expect(preset.group).toBe('base')
    }
  })

  it('should tag all color presets with group "color"', () => {
    for (const preset of COLOR_PRESETS) {
      expect(preset.group).toBe('color')
    }
  })

  it('should include neutral, stone, zinc, gray as base presets', () => {
    // Arrange
    const baseNames = BASE_PRESETS.map((p) => p.name)

    // Assert
    expect(baseNames).toContain('neutral')
    expect(baseNames).toContain('stone')
    expect(baseNames).toContain('zinc')
    expect(baseNames).toContain('gray')
  })
})

// ---------------------------------------------------------------------------
// Base preset completeness
// ---------------------------------------------------------------------------

describe('base presets', () => {
  for (const preset of BASE_PRESETS) {
    describe(preset.title, () => {
      it('should contain all required CSS variable keys in light mode', () => {
        for (const key of REQUIRED_KEYS) {
          expect(preset.cssVars.light, `missing light key: ${key}`).toHaveProperty(key)
        }
      })

      it('should contain all required CSS variable keys in dark mode (except radius)', () => {
        // Arrange — dark mode keys are the same minus 'radius' (only on light)
        const darkKeys = REQUIRED_KEYS.filter((k) => k !== 'radius')

        // Assert
        for (const key of darkKeys) {
          expect(preset.cssVars.dark, `missing dark key: ${key}`).toHaveProperty(key)
        }
      })

      it('should have non-empty string values for all light CSS variables', () => {
        for (const [key, value] of Object.entries(preset.cssVars.light)) {
          expect(typeof value, `${key} is not a string`).toBe('string')
          expect(value.length, `${key} is empty`).toBeGreaterThan(0)
        }
      })

      it('should have non-empty string values for all dark CSS variables', () => {
        for (const [key, value] of Object.entries(preset.cssVars.dark)) {
          expect(typeof value, `${key} is not a string`).toBe('string')
          expect(value.length, `${key} is empty`).toBeGreaterThan(0)
        }
      })
    })
  }
})

// ---------------------------------------------------------------------------
// Color presets are partial (merged onto Zinc base)
// ---------------------------------------------------------------------------

describe('color presets', () => {
  for (const preset of COLOR_PRESETS) {
    describe(preset.title, () => {
      it('should define primary and primary-foreground in both modes', () => {
        expect(preset.cssVars.light).toHaveProperty('primary')
        expect(preset.cssVars.light).toHaveProperty('primary-foreground')
        expect(preset.cssVars.dark).toHaveProperty('primary')
        expect(preset.cssVars.dark).toHaveProperty('primary-foreground')
      })

      it('should define all 5 chart colors in both modes', () => {
        for (let i = 1; i <= 5; i++) {
          expect(preset.cssVars.light, `missing light chart-${i}`).toHaveProperty(`chart-${i}`)
          expect(preset.cssVars.dark, `missing dark chart-${i}`).toHaveProperty(`chart-${i}`)
        }
      })

      it('should define sidebar-primary in both modes', () => {
        expect(preset.cssVars.light).toHaveProperty('sidebar-primary')
        expect(preset.cssVars.dark).toHaveProperty('sidebar-primary')
      })
    })
  }
})

// ---------------------------------------------------------------------------
// getPresetDerivedTheme
// ---------------------------------------------------------------------------

describe('getPresetDerivedTheme', () => {
  it('should return a DerivedTheme with light and dark properties', () => {
    // Arrange
    const zincPreset = BASE_PRESETS.find((p) => p.name === 'zinc') as ShadcnPreset

    // Act
    const derived = getPresetDerivedTheme(zincPreset)

    // Assert
    expect(derived).toHaveProperty('light')
    expect(derived).toHaveProperty('dark')
  })

  it('should contain all required keys when given a base preset', () => {
    // Arrange
    const neutralPreset = BASE_PRESETS.find((p) => p.name === 'neutral') as ShadcnPreset

    // Act
    const derived = getPresetDerivedTheme(neutralPreset)

    // Assert
    for (const key of REQUIRED_KEYS) {
      expect(derived.light, `missing light key: ${key}`).toHaveProperty(key)
    }
  })

  it('should fill missing keys from Zinc base when given a color preset', () => {
    // Arrange
    const bluePreset = COLOR_PRESETS.find((p) => p.name === 'blue') as ShadcnPreset

    // Act
    const derived = getPresetDerivedTheme(bluePreset)

    // Assert — color presets are partial, but result should still have background
    expect(derived.light).toHaveProperty('background')
    expect(derived.dark).toHaveProperty('background')
  })

  it('should override Zinc base values with color preset values', () => {
    // Arrange
    const redPreset = COLOR_PRESETS.find((p) => p.name === 'red') as ShadcnPreset

    // Act
    const derived = getPresetDerivedTheme(redPreset)

    // Assert — primary should come from red, not zinc
    expect(derived.light.primary).toBe(redPreset.cssVars.light.primary)
  })
})

// ---------------------------------------------------------------------------
// getComposedDerivedTheme
// ---------------------------------------------------------------------------

describe('getComposedDerivedTheme', () => {
  const neutralBase = BASE_PRESETS.find((p) => p.name === 'neutral') as ShadcnPreset
  const stoneBase = BASE_PRESETS.find((p) => p.name === 'stone') as ShadcnPreset
  const blueColor = COLOR_PRESETS.find((p) => p.name === 'blue') as ShadcnPreset

  it('should return base-only theme when color is null', () => {
    // Act
    const derived = getComposedDerivedTheme(neutralBase, null)

    // Assert
    expect(derived.light.background).toBe(neutralBase.cssVars.light.background)
    expect(derived.dark.background).toBe(neutralBase.cssVars.dark.background)
  })

  it('should return base-only theme when color is undefined', () => {
    // Act
    const derived = getComposedDerivedTheme(stoneBase)

    // Assert
    expect(derived.light.foreground).toBe(stoneBase.cssVars.light.foreground)
  })

  it('should overlay color preset primary on top of base when color is provided', () => {
    // Act
    const derived = getComposedDerivedTheme(neutralBase, blueColor)

    // Assert — primary should come from blue, background from neutral
    expect(derived.light.primary).toBe(blueColor.cssVars.light.primary)
    expect(derived.light.background).toBe(neutralBase.cssVars.light.background)
  })

  it('should produce a complete variable set for any base × color combination', () => {
    // Act
    const derived = getComposedDerivedTheme(stoneBase, blueColor)

    // Assert
    for (const key of REQUIRED_KEYS) {
      expect(derived.light, `missing light key: ${key}`).toHaveProperty(key)
    }
  })
})

// ---------------------------------------------------------------------------
// getComposedConfig
// ---------------------------------------------------------------------------

describe('getComposedConfig', () => {
  const zincBase = BASE_PRESETS.find((p) => p.name === 'zinc') as ShadcnPreset
  const amberColor = COLOR_PRESETS.find((p) => p.name === 'amber') as ShadcnPreset

  it('should return a ThemeConfig with name matching base title when no color', () => {
    // Act
    const config = getComposedConfig(zincBase)

    // Assert
    expect(config.name).toBe('Zinc')
  })

  it('should return a ThemeConfig with combined name when color is provided', () => {
    // Act
    const config = getComposedConfig(zincBase, amberColor)

    // Assert
    expect(config.name).toBe('Zinc + Amber')
  })

  it('should populate all 8 color seed fields', () => {
    // Act
    const config = getComposedConfig(zincBase, amberColor)

    // Assert
    expect(config.colors.primary).toBeTruthy()
    expect(config.colors.secondary).toBeTruthy()
    expect(config.colors.accent).toBeTruthy()
    expect(config.colors.destructive).toBeTruthy()
    expect(config.colors.muted).toBeTruthy()
    expect(config.colors.background).toBeTruthy()
    expect(config.colors.foreground).toBeTruthy()
    expect(config.colors.border).toBeTruthy()
  })

  it('should use color preset primary when color is provided', () => {
    // Act
    const config = getComposedConfig(zincBase, amberColor)

    // Assert
    expect(config.colors.primary).toBe(amberColor.cssVars.light.primary)
  })

  it('should set default typography and radius', () => {
    // Act
    const config = getComposedConfig(zincBase)

    // Assert
    expect(config.typography.fontFamily).toContain('sans-serif')
    expect(config.radius).toBe('0.625rem')
    expect(config.shadows).toBe('subtle')
  })

  it('should return base-only config when color is null', () => {
    // Act
    const config = getComposedConfig(zincBase, null)

    // Assert
    expect(config.name).toBe('Zinc')
    expect(config.colors.primary).toBe(zincBase.cssVars.light.primary)
  })
})

// ---------------------------------------------------------------------------
// getPresetConfig
// ---------------------------------------------------------------------------

describe('getPresetConfig', () => {
  it('should use the preset itself as base when it is a base preset', () => {
    // Arrange
    const stonePreset = BASE_PRESETS.find((p) => p.name === 'stone') as ShadcnPreset

    // Act
    const config = getPresetConfig(stonePreset)

    // Assert
    expect(config.colors.background).toBe(stonePreset.cssVars.light.background)
  })

  it('should fall back to zinc base when preset is a color preset', () => {
    // Arrange
    const greenPreset = COLOR_PRESETS.find((p) => p.name === 'green') as ShadcnPreset
    const zincBase = BASE_PRESETS.find((p) => p.name === 'zinc') as ShadcnPreset

    // Act
    const config = getPresetConfig(greenPreset)

    // Assert — background should come from zinc, primary from green
    expect(config.colors.primary).toBe(greenPreset.cssVars.light.primary)
    expect(config.colors.background).toBe(zincBase.cssVars.light.background)
  })

  it('should return a valid ThemeConfig for every preset in ALL_PRESETS', () => {
    for (const preset of ALL_PRESETS) {
      const config = getPresetConfig(preset)

      expect(config.name, `${preset.name} missing name`).toBeTruthy()
      expect(config.colors.primary, `${preset.name} missing primary`).toBeTruthy()
      expect(config.radius, `${preset.name} missing radius`).toBeTruthy()
    }
  })
})
