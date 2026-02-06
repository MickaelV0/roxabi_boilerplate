import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Code2, Play } from 'lucide-react'
import { m } from '@/paraglide/messages'

const devAgents = [
  { nameKey: 'ai_agent_dev', roleKey: 'ai_agent_dev_role' },
  { nameKey: 'ai_agent_review', roleKey: 'ai_agent_review_role' },
  { nameKey: 'ai_agent_test', roleKey: 'ai_agent_test_role' },
  { nameKey: 'ai_agent_deploy', roleKey: 'ai_agent_deploy_role' },
  { nameKey: 'ai_agent_product', roleKey: 'ai_agent_product_role' },
  { nameKey: 'ai_agent_ops', roleKey: 'ai_agent_ops_role' },
  { nameKey: 'ai_agent_frontend', roleKey: 'ai_agent_frontend_role' },
  { nameKey: 'ai_agent_backend', roleKey: 'ai_agent_backend_role' },
] as const

const runtimeAgents = [
  { nameKey: 'ai_agent_domain', roleKey: 'ai_agent_domain_role' },
  { nameKey: 'ai_agent_personas', roleKey: 'ai_agent_personas_role' },
  { nameKey: 'ai_agent_integration', roleKey: 'ai_agent_integration_role' },
] as const

function msg(key: string): string {
  const fn = (m as unknown as Record<string, (inputs: Record<string, unknown>) => string>)[key]
  return fn?.({}) ?? key
}

export function AiTeamSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{m.ai_title()}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{m.ai_subtitle()}</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Development Agents */}
          <Card className="border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Code2 className="h-5 w-5 text-primary" />
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
                    key={agent.nameKey}
                    className="rounded-md border border-border px-3 py-2 transition-colors duration-150 hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium">{msg(agent.nameKey)}</span>
                    <p className="text-xs text-muted-foreground">{msg(agent.roleKey)}</p>
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
                  <Play className="h-5 w-5 text-primary" />
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
                    key={agent.nameKey}
                    className="rounded-md border border-border px-3 py-2 transition-colors duration-150 hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium">{msg(agent.nameKey)}</span>
                    <p className="text-xs text-muted-foreground">{msg(agent.roleKey)}</p>
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
