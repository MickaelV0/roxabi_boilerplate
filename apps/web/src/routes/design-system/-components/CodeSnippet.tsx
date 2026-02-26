import { cn } from '@repo/ui'
import { useEffect, useState } from 'react'
import { m } from '@/paraglide/messages'

type CodeSnippetProps = {
  /** The code string to display */
  code: string
  /** Programming language for syntax highlighting */
  language?: string
}

/**
 * Code snippet with Shiki syntax highlighting and copy button.
 *
 * Lazily loads Shiki on the client for dual-theme (light/dark) highlighting.
 * Falls back to a plain `<pre><code>` block while loading or on error.
 */
function useShikiHighlight(code: string, language: string | undefined) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (!language) return

    let cancelled = false

    async function highlight() {
      try {
        const { codeToHtml } = await import('@/lib/shiki')
        const result = await codeToHtml(code, {
          lang: language as string,
          themes: { light: 'github-light', dark: 'github-dark' },
        })
        if (!cancelled) setHtml(result)
      } catch {
        // Shiki failed (e.g. unsupported language) -- keep fallback
      }
    }

    highlight()
    return () => {
      cancelled = true
    }
  }, [code, language])

  return html
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'absolute top-2 right-2 rounded-md border px-2 py-1 text-xs transition-colors z-10',
        'bg-background hover:bg-accent text-muted-foreground hover:text-foreground',
        copied && 'text-green-600 hover:text-green-600'
      )}
      aria-label={copied ? m.ds_code_copied_aria() : m.ds_code_copy_aria()}
    >
      {copied ? `\u2713 ${m.ds_code_copied()}` : m.ds_code_copy()}
    </button>
  )
}

/**
 * Code snippet with Shiki syntax highlighting and copy button.
 *
 * Lazily loads Shiki on the client for dual-theme (light/dark) highlighting.
 * Falls back to a plain `<pre><code>` block while loading or on error.
 */
export function CodeSnippet({ code, language }: CodeSnippetProps) {
  const html = useShikiHighlight(code, language)

  return (
    <div className="relative">
      {language && (
        <span className="text-muted-foreground absolute top-2 left-4 text-xs select-none z-10">
          {language}
        </span>
      )}
      <CopyButton code={code} />
      {html ? (
        <div
          className={cn(
            'overflow-x-auto rounded-lg text-sm [&_pre]:p-4 [&_pre]:font-mono',
            language && '[&_pre]:pt-8',
            '[&_.shiki]:bg-muted',
            'dark:[&_.shiki.github-dark]:bg-muted dark:[&_.shiki.github-light]:hidden',
            '[&_.shiki.github-dark]:hidden dark:[&_.shiki.github-dark]:block'
          )}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates trusted HTML from hardcoded code strings
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className={cn('bg-muted overflow-x-auto rounded-lg p-4 text-sm', language && 'pt-8')}>
          <code className="font-mono">{code}</code>
        </pre>
      )}
    </div>
  )
}
