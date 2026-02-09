import type { ThemeConfig } from '../lib/theme'

/**
 * Warm theme — amber/orange palette with cozy, inviting tones.
 *
 * All color values are OKLch strings.
 * - Primary: warm amber/orange (hue ~75)
 * - Secondary: soft warm beige (hue ~85)
 * - Accent: terracotta/coral (hue ~40)
 * - Destructive: red (hue ~27)
 * - Background: very light warm white
 * - Foreground: very dark warm brown
 * - Border: soft warm gray
 */
export const warmTheme: ThemeConfig = {
  name: 'Warm',
  colors: {
    primary: 'oklch(0.65 0.18 75)',
    secondary: 'oklch(0.94 0.025 85)',
    accent: 'oklch(0.6 0.15 40)',
    destructive: 'oklch(0.55 0.22 27)',
    muted: 'oklch(0.96 0.01 80)',
    background: 'oklch(0.995 0.005 80)',
    foreground: 'oklch(0.2 0.03 55)',
    border: 'oklch(0.9 0.015 75)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: '16px',
  },
  radius: '0.75rem',
  shadows: 'medium',
}
