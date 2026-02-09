interface CodeSnippetProps {
  /** The code string to display */
  code: string
  /** Programming language for syntax highlighting */
  language?: string
}

/**
 * Syntax-highlighted code snippet with copy button.
 *
 * Uses shiki for highlighting (already a project dependency via Fumadocs).
 * Loaded lazily (dynamic import) to avoid bundling shiki eagerly.
 *
 * If shiki chunk exceeds 100KB gzip for this route, falls back to
 * CSS-only syntax theme with <pre><code> and class-based token coloring.
 *
 * Features:
 * - Syntax highlighting via shiki (lazy-loaded)
 * - Copy button (navigator.clipboard.writeText + checkmark confirmation)
 * - Responsive: horizontal scroll for long lines
 */
export function CodeSnippet(_props: CodeSnippetProps) {
  // TODO: implement
  // 1. Lazy-load shiki highlighter
  // 2. Highlight code string
  // 3. Render <pre><code> with highlighted HTML
  // 4. Add copy button with clipboard API
  // 5. Show checkmark confirmation after copy

  return (
    <div>
      <p>CodeSnippet — scaffold placeholder</p>
    </div>
  )
}
