import { cn } from '@repo/ui'
import { m } from '@/paraglide/messages'

const rows = [
  {
    id: '#42',
    title: 'Avatar upload feature',
    size: 'M',
    priority: 'P1',
    priorityColor: 'bg-red-500/20 text-red-400',
    status: 'blocked',
    statusColor: 'text-red-400',
  },
  {
    id: '#38',
    title: 'RBAC permission cache',
    size: 'L',
    priority: 'P2',
    priorityColor: 'bg-orange-500/20 text-orange-400',
    status: 'blocking',
    statusColor: 'text-orange-400',
  },
  {
    id: '#51',
    title: 'Dashboard skill',
    size: 'S',
    priority: 'P1',
    priorityColor: 'bg-red-500/20 text-red-400',
    status: 'ready',
    statusColor: 'text-green-400',
  },
  {
    id: '#29',
    title: 'Multi-tenant onboarding',
    size: 'L',
    priority: 'P2',
    priorityColor: 'bg-orange-500/20 text-orange-400',
    status: 'ready',
    statusColor: 'text-green-400',
  },
]

export function DashboardMockup() {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 font-mono text-[10px] leading-relaxed overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-foreground">{m.talk_tips_dashboard_header()}</span>
        <span className="text-muted-foreground">
          &middot; {m.talk_tips_dashboard_issues_count()}
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-1 text-muted-foreground/70 border-b border-border/30 pb-1 mb-1">
        <span>#</span>
        <span>Title</span>
        <span>Size</span>
        <span>Pri</span>
        <span>Status</span>
      </div>

      {/* Issue rows */}
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-1 py-0.5">
          <span className="text-muted-foreground">{row.id}</span>
          <span className="text-foreground truncate">{row.title}</span>
          <span className="text-blue-400">{row.size}</span>
          <span
            className={cn(
              'inline-flex items-center justify-center rounded px-1',
              row.priorityColor
            )}
          >
            {row.priority}
          </span>
          <span className={row.statusColor}>{row.status}</span>
        </div>
      ))}

      {/* Show more link */}
      <div className="mt-1 text-primary/70 cursor-pointer">{m.talk_tips_dashboard_show_more()}</div>

      {/* Legend */}
      <div className="mt-2 flex gap-3 text-[9px]">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          {m.talk_tips_dashboard_legend_blocked()}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          {m.talk_tips_dashboard_legend_blocking()}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          {m.talk_tips_dashboard_legend_ready()}
        </span>
      </div>

      {/* Dependency graph */}
      <div className="mt-3 border-t border-border/30 pt-2">
        <span className="text-muted-foreground/70">{m.talk_tips_dashboard_section_deps()}</span>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded border border-orange-400/40 px-1.5 py-0.5 text-orange-400">
            #38
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className="rounded border border-red-400/40 px-1.5 py-0.5 text-red-400">#42</span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className="rounded border border-green-400/40 px-1.5 py-0.5 text-green-400">
            #51
          </span>
        </div>
      </div>

      {/* PR section */}
      <div className="mt-2 border-t border-border/30 pt-2 space-y-1">
        <span className="text-muted-foreground/70">{m.talk_tips_dashboard_section_prs()}</span>
        <div className="text-foreground/80">
          feat/42-avatar-upload <span className="text-green-400">&check; checks</span>
        </div>
      </div>

      {/* Worktree section */}
      <div className="mt-2 border-t border-border/30 pt-2 space-y-1">
        <span className="text-muted-foreground/70">
          {m.talk_tips_dashboard_section_worktrees()}
        </span>
        <div className="text-foreground/80">
          ../roxabi-42 <span className="text-muted-foreground">&rarr; feat/42-avatar-upload</span>
        </div>
      </div>
    </div>
  )
}
