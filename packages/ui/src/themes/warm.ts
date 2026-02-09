import type { ThemeConfig } from '../lib/theme'

/**
 * Warm theme — amber/orange palette with warm tones.
 *
 * All color values are OKLch strings.
 */
export const warmTheme: ThemeConfig = {
  name: 'Warm',
  colors: {
    // TODO: implement — define OKLch seed colors for warm palette
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
  radius: '0.75rem',
  shadows: 'medium',
}
