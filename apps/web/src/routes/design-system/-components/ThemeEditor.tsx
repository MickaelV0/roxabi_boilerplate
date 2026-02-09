import type { ThemeConfig } from '@repo/ui'

// TODO: implement — import theme presets and helpers
// import { applyTheme, deriveFullTheme, resetTheme, defaultTheme, oceanTheme, warmTheme, minimalTheme } from '@repo/ui'

interface ThemeEditorProps {
  /** Current theme config */
  config: ThemeConfig
  /** Callback when theme changes */
  onConfigChange: (config: ThemeConfig) => void
  /** Whether the sidebar is open */
  isOpen: boolean
  /** Toggle sidebar open/close */
  onToggle: () => void
}

/**
 * Theme editor sidebar panel.
 *
 * Contains:
 * - 8 color pickers (semantic tokens: primary, secondary, accent, etc.)
 * - Font family dropdown
 * - Base font size slider
 * - Border radius slider (auto-calculates sm/md/lg/xl)
 * - Shadow preset selector (none, subtle, medium, strong)
 * - Preset theme buttons (Default, Ocean, Warm, Minimal)
 * - Reset to default button
 * - WCAG contrast indicators per color pair
 *
 * Responsive: sidebar at ≥1024px, slide-over overlay at <1024px.
 * Focus management: focus moves to sidebar on open, returns to trigger on close.
 */
export function ThemeEditor(_props: ThemeEditorProps) {
  // TODO: implement
  // 1. Render color pickers for each seed color (use ColorPicker component)
  // 2. Render typography controls (font family dropdown, font size slider)
  // 3. Render radius slider
  // 4. Render shadow preset selector
  // 5. Render preset theme buttons
  // 6. Render "Reset to default" button
  // 7. On each change: update config → deriveFullTheme → applyTheme → persist to localStorage
  // 8. Show contrast warning indicators for failing WCAG AA pairs
  // 9. Handle responsive layout (sidebar vs slide-over)
  // 10. Manage focus on open/close
  // 11. aria-live region for announcements

  return (
    <aside
      aria-label="Theme editor"
      // TODO: implement responsive classes and visibility
    >
      <p>Theme Editor — scaffold placeholder</p>
    </aside>
  )
}
