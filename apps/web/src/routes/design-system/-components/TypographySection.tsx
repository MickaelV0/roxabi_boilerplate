import type { ThemeConfig } from '@repo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from '@repo/ui'
import { m } from '@/paraglide/messages'

const FONT_SIZES = [
  { label: 'xs', class: 'text-xs', px: '12px' },
  { label: 'sm', class: 'text-sm', px: '14px' },
  { label: 'base', class: 'text-base', px: '16px' },
  { label: 'lg', class: 'text-lg', px: '18px' },
  { label: 'xl', class: 'text-xl', px: '20px' },
  { label: '2xl', class: 'text-2xl', px: '24px' },
  { label: '3xl', class: 'text-3xl', px: '30px' },
  { label: '4xl', class: 'text-4xl', px: '36px' },
]

const HEADING_EXAMPLES = [
  { level: 'h1', class: 'text-4xl font-bold tracking-tight', text: 'Heading 1' },
  { level: 'h2', class: 'text-3xl font-semibold tracking-tight', text: 'Heading 2' },
  { level: 'h3', class: 'text-2xl font-semibold', text: 'Heading 3' },
  { level: 'h4', class: 'text-xl font-semibold', text: 'Heading 4' },
  { level: 'h5', class: 'text-lg font-medium', text: 'Heading 5' },
  { level: 'h6', class: 'text-base font-medium', text: 'Heading 6' },
]

export function TypographySection({ config }: { config: ThemeConfig }) {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">{m.ds_typography_title()}</h2>
      <p className="mb-6 text-muted-foreground">{m.ds_typography_desc()}</p>

      {/* Current font info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">{m.ds_typography_current()}</CardTitle>
          <CardDescription>{m.ds_typography_current_desc()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">{m.ds_typography_family()}</Label>
              <p className="mt-1 font-mono text-sm">{config.typography.fontFamily}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{m.ds_typography_base_size()}</Label>
              <p className="mt-1 font-mono text-sm">{config.typography.baseFontSize}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Size scale */}
      <h3 className="mb-4 text-xl font-semibold">{m.ds_typography_size_scale()}</h3>
      <div className="space-y-3">
        {FONT_SIZES.map((size) => (
          <div
            key={size.label}
            className="flex items-baseline gap-4 border-b border-border pb-3 last:border-0"
          >
            <code className="w-16 shrink-0 text-xs text-muted-foreground">{size.label}</code>
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{size.px}</code>
            <span className={size.class}>{m.ds_typography_sample()}</span>
          </div>
        ))}
      </div>

      {/* Headings */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_typography_headings()}</h3>
      <div className="space-y-4">
        {HEADING_EXAMPLES.map((heading) => (
          <div key={heading.level} className="flex items-baseline gap-4">
            <code className="w-12 shrink-0 text-xs text-muted-foreground">{heading.level}</code>
            <span className={heading.class}>{heading.text}</span>
          </div>
        ))}
      </div>

      {/* Paragraph & prose */}
      <h3 className="mb-4 mt-10 text-xl font-semibold">{m.ds_typography_body()}</h3>
      <Card>
        <CardContent className="pt-6">
          <p className="text-base leading-7">{m.ds_typography_body_primary()}</p>
          <p className="mt-4 text-sm text-muted-foreground leading-6">
            {m.ds_typography_body_secondary()}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
