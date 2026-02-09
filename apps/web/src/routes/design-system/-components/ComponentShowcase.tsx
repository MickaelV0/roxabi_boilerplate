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
} from '@repo/ui'
import type { ReactNode } from 'react'
import { useState } from 'react'

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

  const hasControls = propControls.length > 0
  const codeString = generateCodeString(name, currentProps)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>{name}</CardTitle>
          <Badge variant="secondary">{category}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preview area */}
        <div
          className={cn(
            'flex min-h-[120px] items-center justify-center rounded-lg border border-dashed p-6'
          )}
        >
          {children(currentProps)}
        </div>

        {/* Controls area */}
        {hasControls && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Props</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {propControls.map((control) => (
                <div key={control.name} className="space-y-2">
                  <Label htmlFor={`${name}-${control.name}`}>{control.name}</Label>
                  {control.type === 'select' && control.options && (
                    <select
                      id={`${name}-${control.name}`}
                      value={String(currentProps[control.name] ?? '')}
                      onChange={(e) => updateProp(control.name, e.target.value)}
                      className={cn(
                        'border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-3 py-1 text-sm',
                        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                        'disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      {control.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  {control.type === 'boolean' && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${name}-${control.name}`}
                        checked={Boolean(currentProps[control.name])}
                        onCheckedChange={(checked) => updateProp(control.name, Boolean(checked))}
                      />
                      <Label htmlFor={`${name}-${control.name}`} className="text-sm font-normal">
                        {String(currentProps[control.name])}
                      </Label>
                    </div>
                  )}
                  {control.type === 'text' && (
                    <Input
                      id={`${name}-${control.name}`}
                      value={String(currentProps[control.name] ?? '')}
                      onChange={(e) => updateProp(control.name, e.target.value)}
                    />
                  )}
                  {control.type === 'number' && (
                    <Input
                      id={`${name}-${control.name}`}
                      type="number"
                      value={String(currentProps[control.name] ?? '')}
                      onChange={(e) => updateProp(control.name, Number(e.target.value))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code section toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowCode((prev) => !prev)}
            className={cn(
              'text-muted-foreground hover:text-foreground text-sm font-medium transition-colors'
            )}
            aria-expanded={showCode}
          >
            {showCode ? 'Hide code' : 'Show code'}
          </button>
          {showCode && (
            <div className="mt-3">
              <CodeSnippet code={codeString} language="tsx" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
