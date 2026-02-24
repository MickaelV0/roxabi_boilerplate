import { BASE_PRESETS } from './presets-base'
import type { DerivedTheme, ShadcnPreset, ThemeConfig } from './presets-types'
import { ZINC_BASE } from './presets-types'

/**
 * Merge a (possibly partial) color preset onto the Zinc base to produce
 * a complete DerivedTheme with all CSS variables for both light and dark modes.
 */
export function getPresetDerivedTheme(preset: ShadcnPreset): DerivedTheme {
  return {
    light: { ...ZINC_BASE.light, ...preset.cssVars.light },
    dark: { ...ZINC_BASE.dark, ...preset.cssVars.dark },
  }
}

/**
 * Compose a base preset with an optional color overlay.
 *
 * Color presets are partial (only primary, charts, sidebar-primary, etc.).
 * This merges them on top of the chosen base instead of always using Zinc.
 */
export function getComposedDerivedTheme(
  base: ShadcnPreset,
  color?: ShadcnPreset | null
): DerivedTheme {
  if (!color) {
    return {
      light: { ...ZINC_BASE.light, ...base.cssVars.light },
      dark: { ...ZINC_BASE.dark, ...base.cssVars.dark },
    }
  }

  return {
    light: { ...ZINC_BASE.light, ...base.cssVars.light, ...color.cssVars.light },
    dark: { ...ZINC_BASE.dark, ...base.cssVars.dark, ...color.cssVars.dark },
  }
}

/**
 * Extract a ThemeConfig (8 seed colors + typography + radius + shadows)
 * from a composed base + optional color overlay so the color pickers
 * reflect the effective values.
 */
export function getComposedConfig(base: ShadcnPreset, color?: ShadcnPreset | null): ThemeConfig {
  const merged = color
    ? { ...ZINC_BASE.light, ...base.cssVars.light, ...color.cssVars.light }
    : { ...ZINC_BASE.light, ...base.cssVars.light }

  const v = (key: string): string => merged[key] ?? ''

  return {
    name: color ? `${base.title} + ${color.title}` : base.title,
    colors: {
      primary: v('primary'),
      secondary: v('secondary'),
      accent: v('accent'),
      destructive: v('destructive'),
      muted: v('muted'),
      background: v('background'),
      foreground: v('foreground'),
      border: v('border'),
    },
    typography: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      baseFontSize: '16px',
    },
    radius: v('radius') || '0.625rem',
    shadows: 'medium',
  }
}

/**
 * Extract a ThemeConfig from a single preset (legacy helper).
 * Falls back to Zinc base values for any missing keys.
 */
export function getPresetConfig(preset: ShadcnPreset): ThemeConfig {
  const zincBase = BASE_PRESETS.find((p) => p.name === 'zinc')
  if (!zincBase) throw new Error('Zinc preset not found in BASE_PRESETS')
  return getComposedConfig(
    preset.group === 'base' ? preset : zincBase,
    preset.group === 'color' ? preset : null
  )
}
