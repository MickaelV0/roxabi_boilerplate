import { cn } from '@repo/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { m } from '@/paraglide/messages'

type CompressionDemoProps = {
  beforeContent: string
  afterContent: string
  stats: {
    linesBefore: number
    linesAfter: number
    tokenReduction: string
  }
}

function StatsBar({ stats }: { stats: CompressionDemoProps['stats'] }) {
  const reduction = Math.round(((stats.linesBefore - stats.linesAfter) / stats.linesBefore) * 100)

  return (
    <div className="mt-3 text-xs text-muted-foreground text-center">
      {m.talk_dp_compress_lines()}: {stats.linesBefore} &rarr; {stats.linesAfter}
      {' | '}-{reduction}%{' | '}
      {m.talk_dp_compress_tokens()}: -{stats.tokenReduction}%
    </div>
  )
}

function useSliderDrag() {
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      e.preventDefault()
      updatePosition(e.clientX)
    }
    const onUp = () => {
      setIsDragging(false)
      document.body.style.userSelect = ''
    }
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDragging, updatePosition])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePosition(e.touches[0].clientX)
    }
    const onEnd = () => {
      setIsDragging(false)
      document.body.style.userSelect = ''
    }
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd)
    return () => {
      document.body.style.userSelect = ''
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, updatePosition])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPosition((p) => Math.max(0, p - 5))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPosition((p) => Math.min(100, p + 5))
    }
  }, [])

  return { position, isDragging, containerRef, setIsDragging, handleKeyDown }
}

function SliderDesktop({ beforeContent, afterContent, stats }: CompressionDemoProps) {
  const { position, isDragging, containerRef, setIsDragging, handleKeyDown } = useSliderDrag()

  return (
    <div className="hidden md:block">
      <div
        ref={containerRef}
        className="relative h-[400px] overflow-hidden rounded-lg border bg-muted/30"
      >
        {/* Before panel (full width, underneath) */}
        <div className="absolute inset-0 overflow-auto p-5">
          <span className="mb-3 inline-block rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {m.talk_dp_compress_before()}
          </span>
          <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
            {beforeContent}
          </pre>
        </div>

        {/* After panel (clipped from the right) */}
        <div
          className="absolute inset-0 overflow-auto p-5"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <div className="flex justify-end">
            <span className="mb-3 inline-block rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {m.talk_dp_compress_after()}
            </span>
          </div>
          <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
            {afterContent}
          </pre>
        </div>

        {/* Draggable divider */}
        <div
          className="absolute top-0 bottom-0 z-10 -ml-4 w-8 cursor-col-resize"
          style={{ left: `${position}%` }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => {
            setIsDragging(true)
            document.body.style.userSelect = 'none'
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-label={m.talk_dp_compress_slider_label()}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* Vertical line */}
          <div
            className={cn(
              'absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 transition-colors',
              isDragging ? 'bg-primary' : 'bg-primary/60 hover:bg-primary'
            )}
          />

          {/* Handle grip */}
          <div
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'flex h-10 w-6 flex-col items-center justify-center gap-1',
              'rounded-md border-2 border-primary bg-background shadow-md',
              'transition-shadow',
              isDragging && 'shadow-lg'
            )}
          >
            <div className="h-px w-3 rounded-full bg-primary/50" />
            <div className="h-px w-3 rounded-full bg-primary/50" />
            <div className="h-px w-3 rounded-full bg-primary/50" />
          </div>
        </div>
      </div>

      <StatsBar stats={stats} />
    </div>
  )
}

function SliderMobile({ beforeContent, afterContent, stats }: CompressionDemoProps) {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before')

  return (
    <div className="md:hidden">
      {/* Toggle buttons */}
      <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'before'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('before')}
        >
          {m.talk_dp_compress_before()}
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'after'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('after')}
        >
          {m.talk_dp_compress_after()}
        </button>
      </div>

      {/* Content panel */}
      <div className="min-h-[250px] overflow-auto rounded-lg border bg-muted/30 p-4">
        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
          {activeTab === 'before' ? beforeContent : afterContent}
        </pre>
      </div>

      <StatsBar stats={stats} />
    </div>
  )
}

export function CompressionDemo(props: CompressionDemoProps) {
  return (
    <>
      <SliderDesktop {...props} />
      <SliderMobile {...props} />
    </>
  )
}
