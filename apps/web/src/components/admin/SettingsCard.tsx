import type { SettingType, SystemSetting } from '@repo/types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@repo/ui'
import { SaveIcon } from 'lucide-react'
import { useState } from 'react'

type SettingsCardProps = {
  category: string
  settings: SystemSetting[]
  onSave: (updates: Array<{ key: string; value: unknown }>) => Promise<void>
}

function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function coerceValue(raw: unknown, type: SettingType): unknown {
  if (type === 'boolean') return Boolean(raw)
  if (type === 'number') return Number(raw)
  return raw
}

function SettingInput({
  setting,
  value,
  onChange,
}: {
  setting: SystemSetting
  value: unknown
  onChange: (value: unknown) => void
}) {
  switch (setting.type) {
    case 'boolean':
      return (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked: boolean) => onChange(checked)}
          aria-label={setting.name}
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          value={String(value ?? '')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          className="max-w-xs"
        />
      )

    case 'select': {
      const options = setting.metadata?.options ?? []
      return (
        <Select value={String(value ?? '')} onValueChange={(v: string) => onChange(v)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    default:
      return (
        <Input
          type="text"
          value={String(value ?? '')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="max-w-xs"
        />
      )
  }
}

function useSettingsForm(settings: SystemSetting[]) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const setting of settings) {
      initial[setting.key] = setting.value
    }
    return initial
  })
  const [saving, setSaving] = useState(false)

  const isDirty = settings.some((setting) => {
    const current = coerceValue(values[setting.key], setting.type)
    const original = coerceValue(setting.value, setting.type)
    return current !== original
  })

  function handleChange(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function getChangedSettings() {
    return settings
      .filter((setting) => {
        const current = coerceValue(values[setting.key], setting.type)
        const original = coerceValue(setting.value, setting.type)
        return current !== original
      })
      .map((setting) => ({
        key: setting.key,
        value: coerceValue(values[setting.key], setting.type),
      }))
  }

  return { values, saving, setSaving, isDirty, handleChange, getChangedSettings }
}

function SettingRow({
  setting,
  value,
  onChange,
}: {
  setting: SystemSetting
  value: unknown
  onChange: (value: unknown) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor={`setting-${setting.key}`}>{setting.name}</Label>
          {setting.description && (
            <p className="text-xs text-muted-foreground">{setting.description}</p>
          )}
        </div>
        {setting.type === 'boolean' && (
          <SettingInput setting={setting} value={value} onChange={onChange} />
        )}
      </div>
      {setting.type !== 'boolean' && (
        <SettingInput setting={setting} value={value} onChange={onChange} />
      )}
    </div>
  )
}

function SettingsCard({ category, settings, onSave }: SettingsCardProps) {
  const { values, saving, setSaving, isDirty, handleChange, getChangedSettings } =
    useSettingsForm(settings)

  async function handleSave() {
    const changed = getChangedSettings()
    if (changed.length === 0) return

    setSaving(true)
    try {
      await onSave(changed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{capitalize(category)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settings.map((setting) => (
            <SettingRow
              key={setting.key}
              setting={setting}
              value={values[setting.key]}
              onChange={(v) => handleChange(setting.key, v)}
            />
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={!isDirty || saving} size="sm">
              <SaveIcon className="size-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { SettingsCard }
export type { SettingsCardProps }
