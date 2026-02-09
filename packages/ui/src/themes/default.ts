import type { ThemeConfig } from '../lib/theme'

/**
 * Default theme — zinc-based, matching the existing Shadcn CSS variables.
 *
 * All color values are OKLch strings extracted from the light mode :root
 * variables in theme.css.
 */
export const defaultTheme: ThemeConfig = {
  name: 'Default',
  colors: {
    primary: 'oklch(0.21 0.006 285.885)',
    secondary: 'oklch(0.967 0.001 286.375)',
    accent: 'oklch(0.967 0.001 286.375)',
    destructive: 'oklch(0.577 0.245 27.325)',
    muted: 'oklch(0.967 0.001 286.375)',
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.141 0.005 285.823)',
    border: 'oklch(0.92 0.004 286.32)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: '16px',
  },
  radius: '0.625rem',
  shadows: 'subtle',
}
