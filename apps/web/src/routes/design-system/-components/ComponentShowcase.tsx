import type { ReactNode } from 'react'

interface PropControl {
  name: string
  type: 'select' | 'boolean' | 'text' | 'number'
  options?: string[]
  defaultValue: unknown
}

interface ComponentShowcaseProps {
  /** Component display name */
  name: string
  /** Category for grouping (Inputs, Feedback, Layout, Data Display, Navigation) */
  category: string
  /** Prop controls configuration — empty array for Wave 2 components */
  propControls: PropControl[]
  /** Render function that receives current prop values */
  children: (props: Record<string, unknown>) => ReactNode
}

/**
 * Interactive component showcase wrapper.
 *
 * For Wave 1 components: renders preview + prop controls + code snippet.
 * For Wave 2 components: renders default preview only (no interactive controls).
 *
 * Features:
 * - Live preview area
 * - Prop controls panel (variant, size, disabled toggles, etc.)
 * - Code snippet with copy button (loaded lazily via CodeSnippet)
 * - Keyboard accessible controls
 */
export function ComponentShowcase(_props: ComponentShowcaseProps) {
  // TODO: implement
  // 1. Manage prop state from propControls defaults
  // 2. Render preview area with children(currentProps)
  // 3. Render prop controls (select, checkbox, input for each control)
  // 4. Render expandable code snippet section (lazy-loaded)
  // 5. If propControls is empty (Wave 2), hide controls panel

  return (
    <div>
      <p>ComponentShowcase — scaffold placeholder</p>
    </div>
  )
}
