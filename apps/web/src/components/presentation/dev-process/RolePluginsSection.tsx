import { AnimatedSection, Card, cn } from '@repo/ui'
import { LayoutDashboard, Megaphone, Palette, Scale, TrendingUp, Users } from 'lucide-react'
import { m } from '@/paraglide/messages'

type RoleCardData = {
  icon: React.ReactNode
  label: string
  skills: readonly [() => string, () => string, () => string]
  iconBgClass: string
  borderClass: string
  iconColorClass: string
}

const ROLES: RoleCardData[] = [
  {
    icon: <LayoutDashboard className="h-4 w-4 text-violet-500" />,
    label: m.talk_dp_roles_pm_label(),
    skills: [m.talk_dp_roles_pm_skill1, m.talk_dp_roles_pm_skill2, m.talk_dp_roles_pm_skill3],
    iconBgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/20 bg-violet-500/5',
    iconColorClass: 'text-violet-500',
  },
  {
    icon: <Megaphone className="h-4 w-4 text-pink-500" />,
    label: m.talk_dp_roles_marketing_label(),
    skills: [
      m.talk_dp_roles_marketing_skill1,
      m.talk_dp_roles_marketing_skill2,
      m.talk_dp_roles_marketing_skill3,
    ],
    iconBgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/20 bg-pink-500/5',
    iconColorClass: 'text-pink-500',
  },
  {
    icon: <Palette className="h-4 w-4 text-cyan-500" />,
    label: m.talk_dp_roles_design_label(),
    skills: [
      m.talk_dp_roles_design_skill1,
      m.talk_dp_roles_design_skill2,
      m.talk_dp_roles_design_skill3,
    ],
    iconBgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20 bg-cyan-500/5',
    iconColorClass: 'text-cyan-500',
  },
  {
    icon: <Scale className="h-4 w-4 text-amber-500" />,
    label: m.talk_dp_roles_legal_label(),
    skills: [
      m.talk_dp_roles_legal_skill1,
      m.talk_dp_roles_legal_skill2,
      m.talk_dp_roles_legal_skill3,
    ],
    iconBgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20 bg-amber-500/5',
    iconColorClass: 'text-amber-500',
  },
  {
    icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    label: m.talk_dp_roles_sales_label(),
    skills: [
      m.talk_dp_roles_sales_skill1,
      m.talk_dp_roles_sales_skill2,
      m.talk_dp_roles_sales_skill3,
    ],
    iconBgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20 bg-green-500/5',
    iconColorClass: 'text-green-500',
  },
]

type RoleCardProps = {
  role: RoleCardData
}

function RoleCard({ role }: RoleCardProps) {
  return (
    <AnimatedSection>
      <Card variant="subtle" className={cn('flex flex-col gap-3 p-5 h-full', role.borderClass)}>
        <div className={cn('rounded-lg p-2 w-fit', role.iconBgClass)}>{role.icon}</div>
        <p className="text-sm font-semibold">{role.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {role.skills.map((skill, i) => (
            <span
              key={i}
              className="bg-muted/40 text-muted-foreground text-xs rounded-full px-2 py-0.5"
            >
              {skill()}
            </span>
          ))}
        </div>
      </Card>
    </AnimatedSection>
  )
}

export function RolePluginsSection() {
  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      <AnimatedSection>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-violet-500/10 p-2">
            <Users className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {m.talk_dp_roles_title()}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{m.talk_dp_roles_subtitle()}</p>
          </div>
        </div>
      </AnimatedSection>

      {/* Role cards */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => (
          <RoleCard key={role.label} role={role} />
        ))}
      </div>

      {/* Bottom callout */}
      <AnimatedSection className="mt-6">
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 text-center">
          <p className="text-sm font-medium text-violet-500">{m.talk_dp_roles_callout()}</p>
        </div>
      </AnimatedSection>
    </div>
  )
}
