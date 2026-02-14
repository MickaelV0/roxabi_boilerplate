import { cn, useInView } from '@repo/ui'
import { useEffect, useState } from 'react'
import { type BundledLanguage, codeToHtml } from 'shiki'

type CodeBlockProps = {
  children: string
  language?: BundledLanguage
  typing?: boolean
  className?: string
}

/** @security children MUST be developer-controlled string literals. Never pass user input. */
export function CodeBlock({
  children,
  language = 'bash',
  typing = false,
  className,
}: CodeBlockProps) {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })
  const [typingComplete, setTypingComplete] = useState(!typing)
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)

  // Load Shiki-highlighted HTML only when visible
  useEffect(() => {
    if (!inView) return
    let cancelled = false

    codeToHtml(children, {
      lang: language,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    })
      .then((html) => {
        if (!cancelled) {
          setHighlightedHtml(html)
        }
      })
      .catch(() => {
        // Fall through to plain <pre> fallback
      })

    return () => {
      cancelled = true
    }
  }, [children, language, inView])

  // Start typing animation timer when visible
  useEffect(() => {
    if (!inView || !typing || typingComplete) return
    const lines = children.split('\n').length
    const duration = Math.min(lines * 300, 3000)
    const timer = setTimeout(() => setTypingComplete(true), duration)
    return () => clearTimeout(timer)
  }, [inView, typing, typingComplete, children])

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
        <div className="size-3 rounded-full bg-red-500/60" />
        <div className="size-3 rounded-full bg-yellow-500/60" />
        <div className="size-3 rounded-full bg-green-500/60" />
      </div>

      <div className="overflow-x-auto p-5">
        {highlightedHtml ? (
          <div
            className={cn(
              'font-mono text-sm leading-relaxed [&_pre]:!bg-transparent [&_code]:!bg-transparent',
              typing && inView && !typingComplete && 'animate-typing-reveal'
            )}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki generates trusted HTML from hardcoded presentation code
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre
            className={cn(
              'font-mono text-sm leading-relaxed text-foreground/90',
              typing && inView && !typingComplete && 'animate-typing-reveal'
            )}
          >
            <code>{children}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
