import type { ThemeConfig } from '../lib/theme'

/**
 * Minimal theme — monochrome, low-contrast, clean aesthetic.
 *
 * All color values are OKLch strings.
 */
export const minimalTheme: ThemeConfig = {
  name: 'Minimal',
  colors: {
    // TODO: implement — define OKLch seed colors for minimal palette
    primary: 'oklch(0 0 0)', // placeholder
    secondary: 'oklch(0 0 0)', // placeholder
    accent: 'oklch(0 0 0)', // placeholder
    destructive: 'oklch(0 0 0)', // placeholder
    muted: 'oklch(0 0 0)', // placeholder
    background: 'oklch(0 0 0)', // placeholder
    foreground: 'oklch(0 0 0)', // placeholder
    border: 'oklch(0 0 0)', // placeholder
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: '16px',
  },
  radius: '0.25rem',
  shadows: 'none',
}
