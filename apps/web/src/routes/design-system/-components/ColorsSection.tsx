import type { ThemeConfig } from '@repo/ui'
import { Card, CardContent, cn, oklchToHex } from '@repo/ui'
import { m } from '@/paraglide/messages'
import { SEED_COLOR_KEYS } from './theme-utils'

export function ColorsSection({ config }: { config: ThemeConfig }) {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_colors_title()}</h2>
      <p className="mb-6 text-muted-foreground">{m.ds_colors_desc()}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SEED_COLOR_KEYS.map((key) => {
          const oklchValue = config.colors[key]
          let hexValue: string
          try {
            hexValue = oklchToHex(oklchValue)
          } catch {
            hexValue = '#000000'
          }

          return (
            <Card key={key}>
              <div className="h-20 rounded-t-lg" style={{ backgroundColor: hexValue }} />
              <CardContent className="pt-3">
                <p className="text-sm font-medium capitalize">{key}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{hexValue}</p>
                <p
                  className="mt-0.5 font-mono text-xs text-muted-foreground truncate"
                  title={oklchValue}
                >
                  {oklchValue}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Derived variable preview */}
      <h3 className="mb-3 mt-10 text-xl font-semibold">{m.ds_colors_derived_title()}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{m.ds_colors_derived_desc()}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'bg-primary', className: 'bg-primary' },
          { name: 'bg-secondary', className: 'bg-secondary' },
          { name: 'bg-accent', className: 'bg-accent' },
          { name: 'bg-destructive', className: 'bg-destructive' },
          { name: 'bg-muted', className: 'bg-muted' },
          { name: 'bg-background', className: 'bg-background border border-border' },
          { name: 'text-foreground', className: 'bg-background border border-border' },
          { name: 'border-border', className: 'bg-background border-2 border-border' },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <div className={cn('size-10 shrink-0 rounded-md', item.className)} />
            <code className="text-xs text-muted-foreground">{item.name}</code>
          </div>
        ))}
      </div>
    </section>
  )
}
