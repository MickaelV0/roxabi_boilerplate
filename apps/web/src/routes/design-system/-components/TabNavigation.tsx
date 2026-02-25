import { cn } from '@repo/ui'
import { m } from '@/paraglide/messages'
import type { TabId } from './theme-utils'

export function getTabs(): { id: TabId; label: string }[] {
  return [
    { id: 'colors', label: m.ds_tab_colors() },
    { id: 'typography', label: m.ds_tab_typography() },
    { id: 'spacing', label: m.ds_tab_spacing() },
    { id: 'components', label: m.ds_tab_components() },
    { id: 'compositions', label: m.ds_tab_compositions() },
  ]
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: TabId; label: string }[]
  activeTab: TabId
  onTabChange: (id: TabId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label={m.ds_sections_label()}
      className="mb-8 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1"
    >
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => {
            const currentIndex = tabs.findIndex((t) => t.id === activeTab)
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              const next = tabs[(currentIndex + 1) % tabs.length]
              if (next) onTabChange(next.id)
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault()
              const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length]
              if (prev) onTabChange(prev.id)
            }
          }}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
