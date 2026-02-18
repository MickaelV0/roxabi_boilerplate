import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@repo/ui'
import { PRIMARY_KEYS } from '@/lib/avatar/constants'
import {
  formatOptionLabel,
  isColorProperty,
  isEnumProperty,
  isProbabilityProperty,
} from '@/lib/avatar/helpers'
import type { OptionControlProps, OptionsFormProps, SchemaProperty } from '@/lib/avatar/types'
import { m } from '@/paraglide/messages'

function ColorControl({ name, prop, value, onChange }: OptionControlProps) {
  const currentColors = Array.isArray(value) ? value : ((prop.default as string[]) ?? [])
  const displayColor = currentColors[0] ?? '000000'

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        id={name}
        aria-label={formatOptionLabel(name)}
        value={`#${displayColor}`}
        onChange={(e) => onChange(name, [e.target.value.replace('#', '')])}
        className="size-8 cursor-pointer rounded border bg-transparent"
      />
      <span className="text-xs text-muted-foreground">#{displayColor}</span>
    </div>
  )
}

function EnumControl({ name, prop, value, onChange }: OptionControlProps) {
  const items = prop.items?.enum ?? []
  const selected = Array.isArray(value) ? value : ((prop.default as string[]) ?? [])

  if (items.length <= 1) return null

  return (
    <Select value={selected[0] ?? ''} onValueChange={(v: string) => onChange(name, [v])}>
      <SelectTrigger id={name} className="h-8 text-xs" aria-label={formatOptionLabel(name)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ProbabilityControl({ name, prop, value, onChange }: OptionControlProps) {
  const current = typeof value === 'number' ? value : ((prop.default as number) ?? 0)

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={name}
        aria-label={formatOptionLabel(name)}
        checked={current > 0}
        onCheckedChange={(checked: boolean) => onChange(name, checked ? 100 : 0)}
      />
      <span className="text-xs text-muted-foreground">
        {current > 0 ? m.avatar_option_enabled() : m.avatar_option_disabled()}
      </span>
    </div>
  )
}

export function OptionsForm({ schema, options, onChange }: OptionsFormProps) {
  const entries = Object.entries(schema.properties)
  const primary = entries.filter(([key]) => PRIMARY_KEYS.has(key))
  const advanced = entries.filter(([key]) => !PRIMARY_KEYS.has(key))

  function renderControl(key: string, prop: SchemaProperty) {
    const value = options[key]
    const controlProps = { name: key, prop, value, onChange }

    if (isColorProperty(prop)) return <ColorControl {...controlProps} />
    if (isProbabilityProperty(prop)) return <ProbabilityControl {...controlProps} />
    if (isEnumProperty(prop)) return <EnumControl {...controlProps} />
    return null
  }

  function renderGroup(items: [string, SchemaProperty][]) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([key, prop]) => {
          const control = renderControl(key, prop)
          if (!control) return null
          return (
            <div key={key} className="space-y-1">
              <Label htmlFor={key} className="text-xs font-medium">
                {formatOptionLabel(key)}
              </Label>
              {control}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {primary.length > 0 && renderGroup(primary)}
      {advanced.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger className="py-2 text-sm font-medium">
              {m.avatar_advanced_options()}
            </AccordionTrigger>
            <AccordionContent>{renderGroup(advanced)}</AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
