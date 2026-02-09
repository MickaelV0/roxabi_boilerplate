import type { ThemeConfig } from '../lib/theme'

/**
 * Ocean theme — blue-teal palette with cool, calming tones.
 *
 * All color values are OKLch strings.
 * - Primary: strong blue (hue ~260)
 * - Secondary: soft teal (hue ~195)
 * - Accent: bright cyan-teal (hue ~200)
 * - Destructive: warm red (hue ~27)
 * - Background: very light blue-tinted white
 * - Foreground: very dark navy
 * - Border: soft blue-gray
 */
export const oceanTheme: ThemeConfig = {
  name: 'Ocean',
  colors: {
    primary: 'oklch(0.45 0.2 260)',
    secondary: 'oklch(0.92 0.03 195)',
    accent: 'oklch(0.7 0.12 200)',
    destructive: 'oklch(0.55 0.22 27)',
    muted: 'oklch(0.95 0.008 220)',
    background: 'oklch(0.99 0.005 240)',
    foreground: 'oklch(0.17 0.03 255)',
    border: 'oklch(0.88 0.02 230)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: '16px',
  },
  radius: '0.5rem',
  shadows: 'medium',
}
