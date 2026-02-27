import { Badge, Card, cn } from '@repo/ui'
import { m } from '@/paraglide/messages'

export type StepCardData = {
  icon: React.ReactNode
  title: string
  goal: string
  artifact?: string
  gate?: string
  badge?: string
  extra?: React.ReactNode
  color: string
  borderColor: string
}

export function StepCard({ card }: { card: StepCardData }) {
  return (
    <Card variant="subtle" className={cn('p-4 lg:p-5 h-full', card.borderColor)}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn('rounded-lg p-2', card.color)}>{card.icon}</div>
        <h3 className="font-bold text-sm">{card.title}</h3>
        {card.badge && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            {card.badge}
          </Badge>
        )}
      </div>
      <div className="space-y-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
            {m.talk_dp_goal()}
          </p>
          <p className="text-xs text-muted-foreground">{card.goal}</p>
        </div>
        {card.artifact && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
              {m.talk_dp_artifact()}
            </p>
            <p className="text-xs font-mono text-foreground/80">{card.artifact}</p>
          </div>
        )}
        {card.gate && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
              {m.talk_dp_gate()}
            </p>
            <p className="text-xs text-muted-foreground">{card.gate}</p>
          </div>
        )}
        {card.extra}
      </div>
    </Card>
  )
}
