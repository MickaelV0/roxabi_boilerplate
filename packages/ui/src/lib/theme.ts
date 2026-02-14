/**
 * Theme engine: ThemeConfig type, derivation, and CSS variable application.
 *
 * This module owns:
 * - ThemeConfig types (seed colors + typography + radius + shadows)
 * - deriveFullTheme(): produces all 30+ CSS variables from 8 seed colors
 * - applyTheme(): sets CSS custom properties on the document
 * - resetTheme(): removes all custom property overrides
 *
 * This module does NOT own persistence (localStorage, API). That lives in apps/web.
 */

import { converter, formatHex, parse } from 'culori'

const toOklch = converter('oklch')
const toRgb = converter('rgb')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemeColors = {
  primary: string // OKLch value - seed
  secondary: string // OKLch value - seed
  accent: string // OKLch value - seed
  destructive: string // OKLch value - seed
  muted: string // OKLch value - seed
  background: string // OKLch value - seed
  foreground: string // OKLch value - seed
  border: string // OKLch value - seed
}

export type ThemeTypography = {
  fontFamily: string
  baseFontSize: string // e.g., "16px"
}

export type ThemeShadows = 'none' | 'subtle' | 'medium' | 'strong'

export type ThemeConfig = {
  name: string
  colors: ThemeColors
  typography: ThemeTypography
  radius: string // e.g., "0.625rem"
  shadows: ThemeShadows
}

/** Full set of CSS variables for both light and dark modes */
export type DerivedTheme = {
  light: Record<string, string>
  dark: Record<string, string>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STYLE_ELEMENT_ID = 'roxabi-theme-dark'

/**
 * Shadow presets mapped to Tailwind v4 CSS variable overrides.
 * 'medium' is empty — uses Tailwind defaults (no override needed).
 */
export const SHADOW_PRESETS: Record<ThemeShadows, Record<string, string>> = {
  none: {
    'shadow-xs': '0 0 #0000',
    'shadow-sm': '0 0 #0000',
    shadow: '0 0 #0000',
    'shadow-md': '0 0 #0000',
    'shadow-lg': '0 0 #0000',
    'shadow-xl': '0 0 #0000',
    'shadow-2xl': '0 0 #0000',
  },
  subtle: {
    'shadow-xs': '0 1px 1px 0 rgb(0 0 0 / 0.03)',
    'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    'shadow-md': '0 3px 5px -1px rgb(0 0 0 / 0.06), 0 2px 3px -2px rgb(0 0 0 / 0.06)',
    'shadow-lg': '0 8px 12px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
    'shadow-xl': '0 16px 24px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
    'shadow-2xl': '0 24px 48px -12px rgb(0 0 0 / 0.15)',
  },
  medium: {},
  strong: {
    'shadow-xs': '0 1px 2px 0 rgb(0 0 0 / 0.08)',
    'shadow-sm': '0 1px 3px 0 rgb(0 0 0 / 0.12)',
    shadow: '0 2px 6px 0 rgb(0 0 0 / 0.15), 0 1px 3px -1px rgb(0 0 0 / 0.15)',
    'shadow-md': '0 6px 12px -2px rgb(0 0 0 / 0.15), 0 3px 6px -3px rgb(0 0 0 / 0.15)',
    'shadow-lg': '0 12px 24px -4px rgb(0 0 0 / 0.15), 0 6px 10px -6px rgb(0 0 0 / 0.15)',
    'shadow-xl': '0 24px 48px -8px rgb(0 0 0 / 0.15), 0 12px 16px -8px rgb(0 0 0 / 0.15)',
    'shadow-2xl': '0 32px 64px -16px rgb(0 0 0 / 0.3)',
  },
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/**
 * Parse an "oklch(L C H)" string into its numeric components.
 * @param oklchStr - e.g., "oklch(0.62 0.21 264)"
 * @returns Object with l, c, h numeric values
 */
export function parseOklch(oklchStr: string): { l: number; c: number; h: number } {
  const color = parse(oklchStr)
  if (!color) {
    throw new Error(`Failed to parse color: ${oklchStr}`)
  }
  const oklch = toOklch(color)
  if (!oklch) {
    throw new Error(`Failed to convert to oklch: ${oklchStr}`)
  }
  return {
    l: oklch.l,
    c: oklch.c,
    h: oklch.h ?? 0,
  }
}

/**
 * Format OKLch numeric components into an "oklch(L C H)" string.
 * Values are rounded to 3 decimal places for readability.
 */
export function formatOklchStr(l: number, c: number, h: number): string {
  const rl = round(l, 3)
  const rc = round(c, 3)
  const rh = round(h, 3)
  return `oklch(${rl} ${rc} ${rh})`
}

/**
 * Convert a hex color string to an OKLch string.
 * @param hex - e.g., "#3b82f6"
 * @returns OKLch string, e.g., "oklch(0.623 0.214 264.052)"
 */
export function hexToOklch(hex: string): string {
  const color = parse(hex)
  if (!color) {
    throw new Error(`Failed to parse hex color: ${hex}`)
  }
  const oklch = toOklch(color)
  if (!oklch) {
    throw new Error(`Failed to convert to oklch: ${hex}`)
  }
  return formatOklchStr(oklch.l, oklch.c, oklch.h ?? 0)
}

/**
 * Convert an OKLch string to hex.
 * @param oklchStr - e.g., "oklch(0.62 0.21 264)"
 * @returns hex string, e.g., "#3b82f6"
 */
export function oklchToHex(oklchStr: string): string {
  const color = parse(oklchStr)
  if (!color) {
    throw new Error(`Failed to parse oklch color: ${oklchStr}`)
  }
  const hex = formatHex(color)
  return hex
}

/**
 * Linearize an sRGB channel value (0-1) for luminance calculation.
 * Uses the standard sRGB transfer function.
 */
function linearize(channel: number): number {
  if (channel <= 0.04045) {
    return channel / 12.92
  }
  return ((channel + 0.055) / 1.055) ** 2.4
}

/**
 * Compute the relative luminance of a color (from an OKLch string).
 * Uses the WCAG formula: L = 0.2126*R + 0.7152*G + 0.0722*B
 * where R, G, B are linearized sRGB values.
 */
function relativeLuminance(oklchStr: string): number {
  const color = parse(oklchStr)
  if (!color) {
    throw new Error(`Failed to parse color for luminance: ${oklchStr}`)
  }
  const rgb = toRgb(color)
  if (!rgb) {
    throw new Error(`Failed to convert to rgb for luminance: ${oklchStr}`)
  }

  // Clamp to [0,1] to handle out-of-gamut colors
  const r = clamp(rgb.r, 0, 1)
  const g = clamp(rgb.g, 0, 1)
  const b = clamp(rgb.b, 0, 1)

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/**
 * Compute WCAG contrast ratio between two OKLch color strings.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 >= L2.
 * @returns contrast ratio (e.g., 4.5 means WCAG AA pass for normal text)
 */
export function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1)
  const l2 = relativeLuminance(color2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if a foreground/background pair meets WCAG AA (4.5:1 for normal text).
 */
export function meetsWcagAA(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Clamp a number to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Round a number to N decimal places. */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Derive a foreground color from a seed color.
 *
 * Rule: L' = clamp(1 - L, 0.15, 0.95).
 * If |L' - L| < 0.4, force L' = L > 0.5 ? 0.15 : 0.95.
 * Chroma and hue are preserved from the seed.
 */
function deriveForeground(seedOklch: string): string {
  const { l, c, h } = parseOklch(seedOklch)

  let invertedL = clamp(1 - l, 0.15, 0.95)

  if (Math.abs(invertedL - l) < 0.4) {
    invertedL = l > 0.5 ? 0.15 : 0.95
  }

  return formatOklchStr(invertedL, c, h)
}

/**
 * Mirror lightness for dark mode.
 * L_dark = clamp(1 - L_light, 0.1, 0.95). Chroma preserved.
 */
function mirrorForDark(oklchStr: string): string {
  const { l, c, h } = parseOklch(oklchStr)
  const darkL = clamp(1 - l, 0.1, 0.95)
  return formatOklchStr(darkL, c, h)
}

/**
 * Check if two hue values are within a given tolerance (in degrees).
 */
function huesCollide(h1: number, h2: number, tolerance: number): boolean {
  const diff = Math.abs(((h1 - h2 + 540) % 360) - 180)
  return diff < tolerance
}

/**
 * Derive chart colors from primary hue by rotating in steps of 60 degrees.
 * If any chart hue falls within +/-15 degrees of a seed color's hue,
 * shift by +30 degrees to avoid visual collision.
 */
function deriveChartColors(
  primary: { l: number; c: number; h: number },
  seedHues: number[]
): string[] {
  const charts: string[] = []

  for (let n = 0; n < 5; n++) {
    let chartHue = (primary.h + n * 60) % 360

    // Check collision with any seed hue
    for (const seedHue of seedHues) {
      if (huesCollide(chartHue, seedHue, 15)) {
        chartHue = (chartHue + 30) % 360
        break
      }
    }

    charts.push(formatOklchStr(primary.l, primary.c, chartHue))
  }

  return charts
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/**
 * Derive a full set of CSS variables (light + dark) from a ThemeConfig.
 *
 * Derivation rules (from spec):
 * - *-foreground: invert lightness, ensure >= 0.4 contrast
 * - card, popover: copy background
 * - ring: copy border
 * - sidebar: background +/- 0.03 lightness
 * - chart-1..5: rotate primary hue by N*60 degrees
 *
 * @see docs/specs/70-design-system.mdx "Derivation rules"
 */
export function deriveFullTheme(config: ThemeConfig): DerivedTheme {
  const { colors, radius, typography } = config

  const light = deriveVariableSet(colors, 'light')
  const dark = deriveVariableSet(deriveDarkSeeds(colors), 'dark')

  // Add non-color variables to both modes
  light.radius = radius
  dark.radius = radius

  light['font-family'] = typography.fontFamily
  dark['font-family'] = typography.fontFamily

  light['font-size'] = typography.baseFontSize
  dark['font-size'] = typography.baseFontSize

  // Add shadow variables (empty 'medium' preset = Tailwind defaults, no override)
  const shadowVars = SHADOW_PRESETS[config.shadows]
  if (shadowVars) {
    Object.assign(light, shadowVars)
    Object.assign(dark, shadowVars)
  }

  return { light, dark }
}

/**
 * Mirror all seed colors for dark mode.
 */
function deriveDarkSeeds(lightSeeds: ThemeColors): ThemeColors {
  return {
    primary: mirrorForDark(lightSeeds.primary),
    secondary: mirrorForDark(lightSeeds.secondary),
    accent: mirrorForDark(lightSeeds.accent),
    destructive: mirrorForDark(lightSeeds.destructive),
    muted: mirrorForDark(lightSeeds.muted),
    background: mirrorForDark(lightSeeds.background),
    foreground: mirrorForDark(lightSeeds.foreground),
    border: mirrorForDark(lightSeeds.border),
  }
}

/**
 * Derive all CSS variables from a set of seed colors for a single mode.
 */
function deriveVariableSet(seeds: ThemeColors, mode: 'light' | 'dark'): Record<string, string> {
  const vars: Record<string, string> = {}

  // --- Direct seed colors ---
  vars.background = seeds.background
  vars.foreground = seeds.foreground
  vars.primary = seeds.primary
  vars.secondary = seeds.secondary
  vars.accent = seeds.accent
  vars.destructive = seeds.destructive
  vars.muted = seeds.muted
  vars.border = seeds.border

  // --- Derived foreground variants ---
  vars['primary-foreground'] = deriveForeground(seeds.primary)
  vars['secondary-foreground'] = deriveForeground(seeds.secondary)
  vars['accent-foreground'] = deriveForeground(seeds.accent)
  vars['destructive-foreground'] = deriveForeground(seeds.destructive)
  vars['muted-foreground'] = deriveForeground(seeds.muted)

  // --- Card and popover: copy background/foreground ---
  vars.card = seeds.background
  vars['card-foreground'] = seeds.foreground
  vars.popover = seeds.background
  vars['popover-foreground'] = seeds.foreground

  // --- Input: copy border ---
  vars.input = seeds.border

  // --- Ring: same as border ---
  vars.ring = seeds.border

  // --- Sidebar ---
  const bgParsed = parseOklch(seeds.background)
  // Subtract 0.03 in light mode, add 0.03 in dark mode
  const sidebarL =
    mode === 'light' ? clamp(bgParsed.l - 0.03, 0, 1) : clamp(bgParsed.l + 0.03, 0, 1)
  vars.sidebar = formatOklchStr(sidebarL, bgParsed.c, bgParsed.h)
  vars['sidebar-foreground'] = seeds.foreground
  vars['sidebar-primary'] = seeds.primary
  vars['sidebar-primary-foreground'] = vars['primary-foreground']
  vars['sidebar-accent'] = seeds.accent
  vars['sidebar-accent-foreground'] = vars['accent-foreground']
  vars['sidebar-border'] = seeds.border
  vars['sidebar-ring'] = vars.ring

  // --- Chart colors: rotate primary hue by N*60 degrees ---
  const primaryParsed = parseOklch(seeds.primary)
  const seedHues = [
    parseOklch(seeds.primary).h,
    parseOklch(seeds.secondary).h,
    parseOklch(seeds.accent).h,
    parseOklch(seeds.destructive).h,
    parseOklch(seeds.muted).h,
    parseOklch(seeds.background).h,
    parseOklch(seeds.foreground).h,
    parseOklch(seeds.border).h,
  ]

  const chartColors = deriveChartColors(primaryParsed, seedHues)
  for (let i = 0; i < 5; i++) {
    const color = chartColors[i]
    if (color) {
      vars[`chart-${i + 1}`] = color
    }
  }

  return vars
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

/**
 * Apply a derived theme to the document by setting CSS custom properties.
 *
 * Both light and dark values are injected via a single <style> element
 * using :root { ... } and .dark { ... } rules. This avoids inline styles
 * which would override the .dark class selector and break light/dark toggling.
 */
export function applyTheme(derived: DerivedTheme): void {
  if (typeof document === 'undefined') {
    return
  }

  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ELEMENT_ID
    document.head.appendChild(styleEl)
  }

  const lightRules = Object.entries(derived.light)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')

  const darkRules = Object.entries(derived.dark)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n')

  styleEl.textContent = `:root {\n${lightRules}\n}\n.dark {\n${darkRules}\n}`
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/**
 * Remove all custom theme overrides, restoring the stylesheet defaults.
 *
 * Removes the injected <style> element that applyTheme created.
 */
export function resetTheme(): void {
  if (typeof document === 'undefined') {
    return
  }

  const styleEl = document.getElementById(STYLE_ELEMENT_ID)
  if (styleEl) {
    styleEl.remove()
  }
}
