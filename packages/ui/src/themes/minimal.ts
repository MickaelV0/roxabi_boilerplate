import type { ThemeConfig } from '../lib/theme'

/**
 * Minimal theme — monochrome, low-chroma, clean aesthetic.
 *
 * All color values are OKLch strings.
 * - Primary: neutral dark gray (very low chroma)
 * - Secondary: light neutral gray
 * - Accent: slightly blue-tinted gray
 * - Destructive: desaturated red
 * - Background: pure white
 * - Foreground: near black
 * - Border: light gray
 */
export const minimalTheme: ThemeConfig = {
  name: 'Minimal',
  colors: {
    primary: 'oklch(0.3 0.005 0)',
    secondary: 'oklch(0.94 0.003 0)',
    accent: 'oklch(0.6 0.02 250)',
    destructive: 'oklch(0.55 0.12 27)',
    muted: 'oklch(0.96 0.002 0)',
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.15 0.002 0)',
    border: 'oklch(0.9 0.003 0)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: '16px',
  },
  radius: '0.25rem',
  shadows: 'none',
}
