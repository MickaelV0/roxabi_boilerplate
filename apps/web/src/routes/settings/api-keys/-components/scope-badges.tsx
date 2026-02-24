import { Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

function ScopeBadges({ scopes }: { scopes: string[] }) {
  if (scopes.length === 0) {
    return <span className="text-xs text-muted-foreground italic">{m.api_keys_no_scopes()}</span>
  }

  const maxVisible = 3
  const visible = scopes.slice(0, maxVisible)
  const remaining = scopes.length - maxVisible

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((scope) => (
        <Badge key={scope} variant="secondary" className="text-xs font-normal">
          {scope}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs font-normal">
          +{remaining}
        </Badge>
      )}
    </div>
  )
}

export { ScopeBadges }
