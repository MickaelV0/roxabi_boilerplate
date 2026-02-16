import { cn } from '@repo/ui'
import { m } from '@/paraglide/messages'

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

      {/* Row 1 */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-1 py-0.5">
        <span className="text-muted-foreground">#42</span>
        <span className="text-foreground truncate">Avatar upload feature</span>
        <span className="text-blue-400">M</span>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded px-1',
            'bg-red-500/20 text-red-400'
          )}
        >
          P1
        </span>
        <span className="text-red-400">blocked</span>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-1 py-0.5">
        <span className="text-muted-foreground">#38</span>
        <span className="text-foreground truncate">RBAC permission cache</span>
        <span className="text-blue-400">L</span>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded px-1',
            'bg-orange-500/20 text-orange-400'
          )}
        >
          P2
        </span>
        <span className="text-orange-400">blocking</span>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-1 py-0.5">
        <span className="text-muted-foreground">#51</span>
        <span className="text-foreground truncate">Dashboard skill</span>
        <span className="text-blue-400">S</span>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded px-1',
            'bg-red-500/20 text-red-400'
          )}
        >
          P1
        </span>
        <span className="text-green-400">ready</span>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-[2rem_1fr_3rem_3rem_4rem] gap-1 py-0.5">
        <span className="text-muted-foreground">#29</span>
        <span className="text-foreground truncate">Multi-tenant onboarding</span>
        <span className="text-blue-400">L</span>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded px-1',
            'bg-orange-500/20 text-orange-400'
          )}
        >
          P2
        </span>
        <span className="text-green-400">ready</span>
      </div>

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
