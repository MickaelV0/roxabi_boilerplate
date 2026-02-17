'use client'

import { useTheme } from 'next-themes'
import { useEffect, useId, useState } from 'react'

type MermaidProps = {
  chart: string
}

type RenderResult = { success: true; svg: string } | { success: false; error: string }

let lastInitializedTheme: string | undefined

async function ensureMermaidInitialized(
  theme: string | undefined
): Promise<typeof import('mermaid')['default']> {
  const mermaid = (await import('mermaid')).default
  const mermaidTheme = theme === 'dark' ? 'dark' : 'default'

  if (lastInitializedTheme !== mermaidTheme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      suppressErrorRendering: true,
    })
    lastInitializedTheme = mermaidTheme
  }

  return mermaid
}

/** Render a Mermaid chart string to SVG using the mermaid library. */
async function renderMermaidChart(
  containerId: string,
  chart: string,
  theme: string | undefined
): Promise<RenderResult> {
  try {
    const mermaid = await ensureMermaidInitialized(theme)
    const { svg } = await mermaid.render(containerId, chart)
    const DOMPurify = (await import('dompurify')).default
    const cleanSvg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
    return { success: true, svg: cleanSvg }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to render Mermaid diagram'
    return { success: false, error: message }
  }
}

/**
 * Client-side Mermaid diagram renderer.
 *
 * Accepts a `chart` prop containing Mermaid syntax and renders it as SVG.
 * Automatically adapts to the current theme (light/dark) via `next-themes`.
 * Renders only after mount to avoid hydration mismatches.
 */
function Mermaid({ chart }: MermaidProps) {
  const id = useId()
  const containerId = `mermaid-${id.replace(/:/g, '')}`
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!chart) return

    let cancelled = false

    renderMermaidChart(containerId, chart, resolvedTheme).then((result) => {
      if (cancelled) return

      if (result.success) {
        setSvg(result.svg)
        setError('')
      } else {
        setError(result.error)
        setSvg('')
      }
    })

    return () => {
      cancelled = true
    }
  }, [chart, containerId, resolvedTheme])

  if (error) {
    return (
      <div
        role="alert"
        className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        <p className="mb-1 font-medium">Mermaid diagram error</p>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">{error}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <output
        aria-label="Loading diagram"
        className="my-4 flex items-center justify-center rounded-lg border p-8 text-sm text-muted-foreground"
      >
        Loading diagram...
      </output>
    )
  }

  return (
    <div
      className="my-4 flex justify-center [&>svg]:max-w-full"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG is sanitized by DOMPurify after Mermaid renders from controlled MDX chart definitions
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export { Mermaid }
export type { MermaidProps }
