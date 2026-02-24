import type { ThemeConfig } from '@repo/ui'
import { Badge, Button, Card, CardContent, Input } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function SpacingSection({ config }: { config: ThemeConfig }) {
  const radiusSizes = [
    { label: 'sm', calc: `calc(${config.radius} - 4px)` },
    { label: 'md', calc: `calc(${config.radius} - 2px)` },
    { label: 'lg', calc: config.radius },
    { label: 'xl', calc: `calc(${config.radius} + 4px)` },
  ]

  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_spacing_title()}</h2>
      <p className="mb-6 text-muted-foreground">{m.ds_spacing_desc({ radius: config.radius })}</p>

      {/* Radius scale */}
      <h3 className="mb-4 text-xl font-semibold">{m.ds_spacing_radius_title()}</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {radiusSizes.map((size) => (
          <Card key={size.label}>
            <CardContent className="flex flex-col items-center gap-3 pt-6">
              <div
                className="size-20 border-2 border-primary bg-primary/10"
                style={{ borderRadius: size.calc }}
              />
              <div className="text-center">
                <p className="text-sm font-medium">radius-{size.label}</p>
                <code className="text-xs text-muted-foreground">{size.calc}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applied examples */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_spacing_applied()}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">{m.ds_spacing_button_radius()}</p>
            <div className="flex gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">{m.ds_spacing_input_radius()}</p>
            <Input placeholder="Text input..." />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">{m.ds_spacing_badge_radius()}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spacing scale reference */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_spacing_scale_title()}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{m.ds_spacing_scale_desc()}</p>
      <div className="space-y-2">
        {[
          { label: '1', px: '4px' },
          { label: '2', px: '8px' },
          { label: '3', px: '12px' },
          { label: '4', px: '16px' },
          { label: '6', px: '24px' },
          { label: '8', px: '32px' },
          { label: '12', px: '48px' },
          { label: '16', px: '64px' },
        ].map((space) => (
          <div key={space.label} className="flex items-center gap-4">
            <code className="w-10 shrink-0 text-right text-xs text-muted-foreground">
              {space.label}
            </code>
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{space.px}</code>
            <div className="h-4 rounded-sm bg-primary/70" style={{ width: space.px }} />
          </div>
        ))}
      </div>
    </section>
  )
}
