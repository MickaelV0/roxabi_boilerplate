import type { ThemeConfig } from '../lib/theme'

/**
 * Default theme — zinc-based, matching the existing Shadcn CSS variables.
 *
 * All color values are OKLch strings.
 */
export const defaultTheme: ThemeConfig = {
  name: 'Default',
  colors: {
    // TODO: implement — extract OKLch values from existing theme.css
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
  radius: '0.625rem',
  shadows: 'subtle',
}
