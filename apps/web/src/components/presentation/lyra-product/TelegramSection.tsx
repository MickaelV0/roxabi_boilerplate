import { AnimatedSection, Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function TelegramSection() {
  return (
    <div className="relative mx-auto max-w-4xl w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-orange-500/6 blur-[120px]" />
      </div>

      <div className="relative">
        <AnimatedSection>
          <div className="mb-2 font-mono text-[10px] tracking-widest text-orange-400 uppercase">
            {m.talk_lp_telegram_date()}
          </div>
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl mb-6 font-mono text-orange-300">
            {m.talk_lp_telegram_title()}
          </h2>
        </AnimatedSection>

        <AnimatedSection className="mt-4">
          <div className="flex items-center gap-6 max-w-xl">
            <div className="rounded-lg border border-orange-400/30 bg-orange-500/8 px-6 py-4">
              <p className="font-mono text-[9px] text-orange-400/60 uppercase tracking-widest mb-1">
                {m.talk_lp_telegram_label()}
              </p>
              <p className="font-mono text-5xl font-bold text-orange-300">
                {m.talk_lp_telegram_time()}
              </p>
            </div>
            <div>
              <Badge className="border border-orange-400/50 bg-orange-500/10 text-orange-300 font-mono text-[10px] tracking-widest mb-3 block">
                {m.talk_lp_telegram_stat()}
              </Badge>
              <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-xs">
                {m.talk_lp_telegram_body()}
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mt-8">
          <blockquote className="max-w-xl border-l-2 border-amber-500/40 pl-4">
            <p className="text-lg font-semibold text-amber-200/90 italic leading-snug">
              &ldquo;{m.talk_lp_telegram_insight()}&rdquo;
            </p>
          </blockquote>
        </AnimatedSection>
      </div>
    </div>
  )
}
