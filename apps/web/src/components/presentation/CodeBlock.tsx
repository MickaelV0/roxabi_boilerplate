import { cn } from '@repo/ui'
import { useEffect, useRef, useState } from 'react'

type CodeBlockProps = {
  children: string
  typing?: boolean
  className?: string
}

function highlightBash(code: string): string {
  return code
    .split('\n')
    .map((line) => {
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
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [typingComplete, setTypingComplete] = useState(!typing)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      setTypingComplete(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()

          if (typing) {
            const lines = children.split('\n').length
            const duration = Math.min(lines * 300, 3000)
            setTimeout(() => setTypingComplete(true), duration)
          }
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [children, typing])

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

      {typing && isVisible && !typingComplete && (
        <style>{`
          @keyframes typing-reveal {
            from { max-height: 0; }
            to { max-height: 500px; }
          }
          .animate-typing-reveal {
            overflow: hidden;
            animation: typing-reveal 2.5s steps(20, end) forwards;
          }
        `}</style>
      )}
    </div>
  )
}
