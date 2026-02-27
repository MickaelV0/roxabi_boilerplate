import { AnimatedSection, Card } from '@repo/ui'
import { LayoutDashboard, Plug, Terminal } from 'lucide-react'
import { m } from '@/paraglide/messages'

export function CustomToolingSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <Terminal className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_tools_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_tools_subtitle()}</p>
          </div>
        </div>
      </AnimatedSection>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {/* Dashboard card */}
        <AnimatedSection>
          <Card variant="subtle" className="flex flex-col gap-4 p-6 border-cyan-500/20 h-full">
            <div className="rounded-lg bg-cyan-500/10 p-2.5 w-fit">
              <LayoutDashboard className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-base font-semibold">{m.talk_dp_tools_dashboard_title()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {m.talk_dp_tools_dashboard_desc()}
              </p>
            </div>
            <div className="mt-auto rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5">
              <p className="font-mono text-[11px] text-foreground/70">
                <span className="text-cyan-500">$</span> bun run dashboard
              </p>
            </div>
            <p className="text-[11px] text-cyan-500 font-medium italic">
              visibility without context-switching
            </p>
          </Card>
        </AnimatedSection>

        {/* MCP Tools card */}
        <AnimatedSection>
          <Card variant="subtle" className="flex flex-col gap-4 p-6 border-cyan-500/20 h-full">
            <div className="rounded-lg bg-cyan-500/10 p-2.5 w-fit">
              <Plug className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-base font-semibold">{m.talk_dp_tools_mcp_title()}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.talk_dp_tools_mcp_desc()}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {['GitHub', 'Vercel', 'Postgres', 'Linear'].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-0.5 text-[11px] font-medium text-cyan-500"
                >
                  {badge}
                </span>
              ))}
            </div>
          </Card>
        </AnimatedSection>

        {/* Custom CLI card */}
        <AnimatedSection>
          <Card variant="subtle" className="flex flex-col gap-4 p-6 border-cyan-500/20 h-full">
            <div className="rounded-lg bg-cyan-500/10 p-2.5 w-fit">
              <Terminal className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-base font-semibold">{m.talk_dp_tools_cli_title()}</p>
              <p className="mt-1 text-sm text-muted-foreground">{m.talk_dp_tools_cli_desc()}</p>
            </div>
            <div className="mt-auto space-y-1">
              {[
                'bun run dev:clean',
                'bun run db:branch:create --force feat',
                'bun run dashboard',
              ].map((cmd) => (
                <div
                  key={cmd}
                  className="rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5"
                >
                  <p className="font-mono text-[10px] text-foreground/70">
                    <span className="text-cyan-500">$</span> {cmd}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedSection>
      </div>

      {/* Pro Tips strip */}
      <AnimatedSection className="mt-6">
        <div className="rounded-lg border border-border/40 bg-muted/20 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {m.talk_dp_tools_tips_heading()}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border/30 bg-background/60 px-3 py-2">
              <span className="text-xs text-muted-foreground">{m.talk_dp_tools_tip1_label()}</span>
              <code className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan-500">
                localhost:3000
              </code>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/30 bg-background/60 px-3 py-2">
              <span className="text-xs text-muted-foreground">{m.talk_dp_tools_tip2_label()}</span>
              <code className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan-500">
                code ./vision.mdx
              </code>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Bottom callout */}
      <AnimatedSection className="mt-4">
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
          <p className="text-sm font-medium text-cyan-500">{m.talk_dp_tools_callout()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
