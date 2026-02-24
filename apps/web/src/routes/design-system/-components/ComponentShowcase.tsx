import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { m } from '@/paraglide/messages'

import { CodeSnippet } from './CodeSnippet'

type PropControl = {
  name: string
  type: 'select' | 'boolean' | 'text' | 'number'
  options?: string[]
  defaultValue: unknown
}

type ComponentShowcaseProps = {
  /** Component display name */
  name: string
  /** Category for grouping (Inputs, Feedback, Layout, Data Display, Navigation) */
  category: string
  /** Prop controls configuration — empty array for Wave 2 components */
  propControls: PropControl[]
  /** Render function that receives current prop values */
  children: (props: Record<string, unknown>) => ReactNode
}

function generateCodeString(name: string, props: Record<string, unknown>): string {
  const propEntries = Object.entries(props)
  if (propEntries.length === 0) {
    return `<${name} />`
  }

  const propStrings = propEntries
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? key : undefined
      }
      if (typeof value === 'number') {
        return `${key}={${value}}`
      }
      return `${key}="${String(value)}"`
    })
    .filter(Boolean)

  if (propStrings.length <= 2) {
    return `<${name} ${propStrings.join(' ')} />`
  }

  return `<${name}\n  ${propStrings.join('\n  ')}\n/>`
}

/**
 * Interactive component showcase wrapper.
 *
 * For Wave 1 components: renders preview + prop controls + code snippet.
 * For Wave 2 components: renders default preview only (no interactive controls).
 */
type PropControlFieldProps = {
  control: PropControl
  componentName: string
  value: unknown
  onUpdate: (value: unknown) => void
}

function PropControlField({ control, componentName, value, onUpdate }: PropControlFieldProps) {
  const id = `${componentName}-${control.name}`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{control.name}</Label>
      {control.type === 'select' && control.options && (
        <Select value={String(value ?? '')} onValueChange={onUpdate}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {control.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {control.type === 'boolean' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={id}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onUpdate(Boolean(checked))}
          />
          <Label htmlFor={id} className="text-sm font-normal">
            {String(value)}
          </Label>
        </div>
      )}
      {control.type === 'text' && (
        <Input id={id} value={String(value ?? '')} onChange={(e) => onUpdate(e.target.value)} />
      )}
      {control.type === 'number' && (
        <Input
          id={id}
          type="number"
          value={String(value ?? '')}
          onChange={(e) => onUpdate(Number(e.target.value))}
        />
      )}
    </div>
  )
}

/**
 * Interactive component showcase wrapper.
 *
 * For Wave 1 components: renders preview + prop controls + code snippet.
 * For Wave 2 components: renders default preview only (no interactive controls).
 */
export function ComponentShowcase({
  name,
  category,
  propControls,
  children,
}: ComponentShowcaseProps) {
  const [currentProps, setCurrentProps] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const control of propControls) {
      initial[control.name] = control.defaultValue
    }
    return initial
  })
  const [showCode, setShowCode] = useState(false)

  function updateProp(propName: string, value: unknown) {
    setCurrentProps((prev) => ({ ...prev, [propName]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>{name}</CardTitle>
          <Badge variant="secondary">{category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={cn(
            'flex min-h-[120px] items-center justify-center rounded-lg border border-dashed p-6'
          )}
        >
          {children(currentProps)}
        </div>
        {propControls.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{m.ds_showcase_props()}</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {propControls.map((control) => (
                <PropControlField
                  key={control.name}
                  control={control}
                  componentName={name}
                  value={currentProps[control.name]}
                  onUpdate={(value) => updateProp(control.name, value)}
                />
              ))}
            </div>
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => setShowCode((prev) => !prev)}
            className={cn(
              'text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
            )}
            aria-expanded={showCode}
          >
            {showCode ? m.ds_showcase_hide_code() : m.ds_showcase_show_code()}
          </button>
          {showCode && (
            <div className="mt-3">
              <CodeSnippet code={generateCodeString(name, currentProps)} language="tsx" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
