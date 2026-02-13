import { cn, useIntersectionVisibility } from '@repo/ui'
import { useEffect, useState } from 'react'

type CodeBlockProps = {
  children: string
  typing?: boolean
  className?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightBash(code: string): string {
  return code
    .split('\n')
    .map((rawLine) => {
      const line = escapeHtml(rawLine)

      // Comments
      if (line.trimStart().startsWith('#')) {
        return `<span class="text-muted-foreground/70 italic">${line}</span>`
      }

      let result = line

      // Keywords: alias, export
      result = result.replace(
        /\b(alias|export|function|if|then|fi|else|do|done|for|while)\b/g,
        '<span class="text-chart-1">$1</span>'
      )

      // Strings in single quotes
      result = result.replace(/'([^']*)'/g, '\'<span class="text-chart-2">$1</span>\'')

      // Variable assignments (word before =)
      result = result.replace(
        /^(\s*)(\w+)(=)/gm,
        '$1<span class="text-foreground">$2</span><span class="text-muted-foreground">$3</span>'
      )

      return result
    })
    .join('\n')
}

export function CodeBlock({ children, typing = false, className }: CodeBlockProps) {
  const { ref, isVisible } = useIntersectionVisibility<HTMLDivElement>({ threshold: 0.2 })
  const [typingComplete, setTypingComplete] = useState(!typing)

  // Start typing animation timer when visible
  useEffect(() => {
    if (!isVisible || !typing || typingComplete) return
    const lines = children.split('\n').length
    const duration = Math.min(lines * 300, 3000)
    const timer = setTimeout(() => setTypingComplete(true), duration)
    return () => clearTimeout(timer)
  }, [isVisible, typing, typingComplete, children])

  const highlighted = highlightBash(children)

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border/50 bg-muted/30 dark:bg-muted/20 overflow-hidden',
        className
      )}
    >
      {/* Terminal header dots */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-500/60" />
        <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
        <div className="h-3 w-3 rounded-full bg-green-500/60" />
      </div>

      <div className="overflow-x-auto p-5">
        <pre
          className={cn(
            'font-mono text-sm leading-relaxed text-foreground/90',
            typing && isVisible && !typingComplete && 'animate-typing-reveal'
          )}
        >
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: content is hardcoded presentation strings, not user input */}
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  )
}
