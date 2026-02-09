/**
 * Theme engine: ThemeConfig type, derivation, and CSS variable application.
 *
 * This module owns:
 * - ThemeConfig interface (seed colors + typography + radius + shadows)
 * - deriveFullTheme(): produces all 30+ CSS variables from 8 seed colors
 * - applyTheme(): sets CSS custom properties on the document
 * - resetTheme(): removes all custom property overrides
 *
 * This module does NOT own persistence (localStorage, API). That lives in apps/web.
 */

// TODO: implement — add `culori` imports for OKLch ↔ hex conversion
// import { oklch, rgb, formatHex, parse } from 'culori'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeColors {
  primary: string // OKLch value — seed
  secondary: string // OKLch value — seed
  accent: string // OKLch value — seed
  destructive: string // OKLch value — seed
  muted: string // OKLch value — seed
  background: string // OKLch value — seed
  foreground: string // OKLch value — seed
  border: string // OKLch value — seed
}

export interface ThemeTypography {
  fontFamily: string
  baseFontSize: string // e.g., "16px"
}

export type ThemeShadows = 'none' | 'subtle' | 'medium' | 'strong'

export interface ThemeConfig {
  name: string
  colors: ThemeColors
  typography: ThemeTypography
  radius: string // e.g., "0.625rem"
  shadows: ThemeShadows
}

/** Full set of CSS variables for both light and dark modes */
export interface DerivedTheme {
  light: Record<string, string>
  dark: Record<string, string>
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/**
 * Convert a hex color string to an OKLch string.
 * @param hex - e.g., "#3b82f6"
 * @returns OKLch string, e.g., "oklch(0.62 0.21 264)"
 */
export function hexToOklch(_hex: string): string {
  // TODO: implement using culori — parse hex → convert to oklch → format
  throw new Error('Not implemented')
}

/**
 * Convert an OKLch string to hex.
 * @param oklchStr - e.g., "oklch(0.62 0.21 264)"
 * @returns hex string, e.g., "#3b82f6"
 */
export function oklchToHex(_oklchStr: string): string {
  // TODO: implement using culori — parse oklch → convert to rgb → formatHex
  throw new Error('Not implemented')
}

/**
 * Compute relative luminance contrast ratio between two OKLch colors.
 * @returns contrast ratio (e.g., 4.5 means WCAG AA pass for normal text)
 */
export function contrastRatio(_color1: string, _color2: string): number {
  // TODO: implement — convert both to linear RGB, compute relative luminance, return ratio
  throw new Error('Not implemented')
}

/**
 * Check if a foreground/background pair meets WCAG AA (4.5:1 for normal text).
 */
export function meetsWcagAA(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

/**
 * Derive a full set of CSS variables (light + dark) from a ThemeConfig.
 *
 * Derivation rules (from spec):
 * - *-foreground: invert lightness, ensure ≥0.4 contrast
 * - card, popover: copy background
 * - ring: border with 50% alpha
 * - sidebar: background ±0.03 lightness
 * - chart-1..5: rotate primary hue by N*60°
 *
 * @see docs/specs/70-design-system.mdx § "Derivation rules"
 */
export function deriveFullTheme(_config: ThemeConfig): DerivedTheme {
  // TODO: implement all derivation rules from spec
  // 1. Parse each seed color into OKLch components (L, C, H)
  // 2. Derive *-foreground variants (invert L, clamp, ensure contrast)
  // 3. Derive card, popover, input, ring, sidebar variants
  // 4. Derive chart-1..5 (hue rotation)
  // 5. Mirror lightness for dark mode
  // 6. Return { light: Record<string, string>, dark: Record<string, string> }
  throw new Error('Not implemented')
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

/**
 * Apply a derived theme to the document by setting CSS custom properties.
 *
 * Light values go on :root (document.documentElement.style).
 * Dark values go on the .dark element.
 */
export function applyTheme(_derived: DerivedTheme): void {
  // TODO: implement
  // 1. For each light variable: document.documentElement.style.setProperty(`--${key}`, value)
  // 2. For dark: find `.dark` element or apply via data attribute
  // 3. Apply typography (font-family, font-size) and radius
  throw new Error('Not implemented')
}

/**
 * Remove all custom theme overrides, restoring the stylesheet defaults.
 */
export function resetTheme(): void {
  // TODO: implement
  // 1. Remove all inline style properties set by applyTheme
  // 2. Restore defaults from the CSS stylesheet
  throw new Error('Not implemented')
}
