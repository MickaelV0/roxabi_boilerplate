import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Code2, Play } from 'lucide-react'
import { SectionHeading } from '@/components/landing/SectionHeading'
import { m } from '@/paraglide/messages'

export function AiTeamSection() {
  const devAgents = [
    { name: m.ai_agent_dev(), role: m.ai_agent_dev_role() },
    { name: m.ai_agent_review(), role: m.ai_agent_review_role() },
    { name: m.ai_agent_test(), role: m.ai_agent_test_role() },
    { name: m.ai_agent_deploy(), role: m.ai_agent_deploy_role() },
    { name: m.ai_agent_product(), role: m.ai_agent_product_role() },
    { name: m.ai_agent_ops(), role: m.ai_agent_ops_role() },
    { name: m.ai_agent_frontend(), role: m.ai_agent_frontend_role() },
    { name: m.ai_agent_backend(), role: m.ai_agent_backend_role() },
  ]

  const runtimeAgents = [
    { name: m.ai_agent_domain(), role: m.ai_agent_domain_role() },
    { name: m.ai_agent_personas(), role: m.ai_agent_personas_role() },
    { name: m.ai_agent_integration(), role: m.ai_agent_integration_role() },
  ]

  return (
    <section className="bg-gradient-to-b from-background to-muted/20 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading title={m.ai_title()} subtitle={m.ai_subtitle()} className="mb-16" />
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Development Agents */}
          <Card className="border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Code2 className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{m.ai_dev_title()}</CardTitle>
                  <p className="text-sm text-muted-foreground">{m.ai_dev_subtitle()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {devAgents.map((agent) => (
                  <div
                    key={agent.name}
                    className="rounded-md border border-border px-3 py-2 transition-colors duration-150 hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium">{agent.name}</span>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Runtime Agents */}
          <Card className="border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Play className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{m.ai_runtime_title()}</CardTitle>
                  <p className="text-sm text-muted-foreground">{m.ai_runtime_subtitle()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {runtimeAgents.map((agent) => (
                  <div
                    key={agent.name}
                    className="rounded-md border border-border px-3 py-2 transition-colors duration-150 hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium">{agent.name}</span>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs italic text-muted-foreground">{m.ai_cli_note()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
