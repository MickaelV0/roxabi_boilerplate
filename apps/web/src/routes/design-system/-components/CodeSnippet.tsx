import { cn } from '@repo/ui'
import { useState } from 'react'
import { m } from '@/paraglide/messages'

type CodeSnippetProps = {
  /** The code string to display */
  code: string
  /** Programming language for syntax highlighting */
  language?: string
}

/**
 * Code snippet with copy button.
 *
 * Uses a simple `<pre><code>` with basic Tailwind styling (no shiki for now).
 * Includes a copy-to-clipboard button with checkmark confirmation.
 */
export function CodeSnippet({ code, language }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <div className="relative">
      {language && (
        <span className="text-muted-foreground absolute top-2 left-4 text-xs select-none">
          {language}
        </span>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'absolute top-2 right-2 rounded-md border px-2 py-1 text-xs transition-colors',
          'bg-background hover:bg-accent text-muted-foreground hover:text-foreground',
          copied && 'text-green-600 hover:text-green-600'
        )}
        aria-label={copied ? m.ds_code_copied_aria() : m.ds_code_copy_aria()}
      >
        {copied ? `✓ ${m.ds_code_copied()}` : m.ds_code_copy()}
      </button>
      <pre className={cn('bg-muted overflow-x-auto rounded-lg p-4 text-sm', language && 'pt-8')}>
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}
