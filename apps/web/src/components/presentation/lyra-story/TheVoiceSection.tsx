import { AnimatedSection, Card, CardContent, cn, useInView, useReducedMotion } from '@repo/ui'
import { Mic, Mic2, Zap } from 'lucide-react'
import { m } from '@/paraglide/messages'

function WaveformBar({
  height,
  delay,
  visible,
}: {
  height: number
  delay: number
  visible: boolean
}) {
  return (
    <div
      className={cn(
        'w-1.5 rounded-full bg-gradient-to-t from-blue-500 to-purple-400 transition-all duration-700',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        height: `${height}px`,
        transitionDelay: `${delay}ms`,
        animation: visible
          ? `pulse ${1.2 + Math.random() * 0.8}s ease-in-out infinite alternate`
          : 'none',
        animationDelay: `${delay}ms`,
      }}
    />
  )
}

const waveHeights = [
  12, 28, 20, 40, 32, 48, 24, 56, 36, 48, 28, 40, 20, 32, 16, 44, 36, 52, 28, 40, 24, 36, 20, 28,
  16,
]

export function TheVoiceSection() {
  const reducedMotion = useReducedMotion()
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true })
  const visible = inView || reducedMotion

  const systems = [
    {
      icon: <Mic2 className="h-5 w-5 text-blue-400" />,
      label: m.talk_ls_voice_tts_label(),
      desc: m.talk_ls_voice_tts_desc(),
      color: 'blue',
    },
    {
      icon: <Mic className="h-5 w-5 text-purple-400" />,
      label: m.talk_ls_voice_stt_label(),
      desc: m.talk_ls_voice_stt_desc(),
      color: 'purple',
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-400" />,
      label: m.talk_ls_voice_fast_label(),
      desc: m.talk_ls_voice_fast_desc(),
      color: 'yellow',
    },
  ]

  return (
    <div className="relative mx-auto max-w-5xl w-full">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[130px] dark:bg-blue-500/12" />
        <div className="absolute right-0 top-1/4 h-[250px] w-[250px] translate-x-1/3 rounded-full bg-purple-500/6 blur-[80px] dark:bg-purple-500/12" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-2">
            {m.talk_ls_voice_title()}
          </h2>
          <p className="text-lg text-muted-foreground">{m.talk_ls_voice_subtitle()}</p>
        </AnimatedSection>

        {/* Waveform */}
        <div ref={ref} className="mt-10 flex items-center justify-center gap-1.5 h-20">
          {waveHeights.map((h, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static waveform bars, order never changes
            <WaveformBar key={i} height={h} delay={i * 30} visible={visible} />
          ))}
        </div>

        <AnimatedSection className="mt-10 grid gap-4 md:grid-cols-3">
          {systems.map((system) => (
            <Card
              key={system.label}
              variant="subtle"
              className={cn(
                'border',
                system.color === 'blue'
                  ? 'border-blue-500/20 bg-blue-500/5'
                  : system.color === 'purple'
                    ? 'border-purple-500/20 bg-purple-500/5'
                    : 'border-yellow-500/20 bg-yellow-500/5'
              )}
            >
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center gap-2">
                  {system.icon}
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      system.color === 'blue'
                        ? 'text-blue-300'
                        : system.color === 'purple'
                          ? 'text-purple-300'
                          : 'text-yellow-300'
                    )}
                  >
                    {system.label}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{system.desc}</p>
              </CardContent>
            </Card>
          ))}
        </AnimatedSection>

        <AnimatedSection className="mt-10 text-center">
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent lg:text-3xl">
            {m.talk_ls_voice_moment()}
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}
