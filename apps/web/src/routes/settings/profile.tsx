import type { AvatarStyle, UserProfile } from '@repo/types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
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
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Dices } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { isErrorWithMessage } from '@/lib/error-utils'
import { m } from '@/paraglide/messages'

const AVATAR_STYLES = [
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'bottts', label: 'Bottts' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'thumbs', label: 'Thumbs' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'adventurer', label: 'Adventurer' },
  { value: 'toon-head', label: 'Toon Head' },
] as const

type LocalAvatarStyle = (typeof AVATAR_STYLES)[number]['value']

function isAvatarStyle(v: string): v is LocalAvatarStyle {
  return AVATAR_STYLES.some((s) => s.value === v)
}

const STYLE_IMPORTS = {
  lorelei: () => import('@dicebear/lorelei'),
  bottts: () => import('@dicebear/bottts'),
  'pixel-art': () => import('@dicebear/pixel-art'),
  thumbs: () => import('@dicebear/thumbs'),
  avataaars: () => import('@dicebear/avataaars'),
  adventurer: () => import('@dicebear/adventurer'),
  'toon-head': () => import('@dicebear/toon-head'),
} as const

export const Route = createFileRoute('/settings/profile')({
  component: ProfileSettingsPage,
  head: () => ({
    meta: [{ title: 'Profile Settings | Roxabi' }],
  }),
})

function buildDiceBearUrl(
  style: string,
  seed: string,
  options: Record<string, unknown> = {}
): string {
  const params = new URLSearchParams({ seed })
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null) {
      params.set(key, Array.isArray(value) ? value.join(',') : String(value))
    }
  }
  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`
}

// -- Schema types for DiceBear style modules --

type SchemaProperty = {
  type: string
  items?: { type: string; enum?: string[]; pattern?: string }
  minimum?: number
  maximum?: number
  default?: unknown
}

type StyleSchema = {
  properties: Record<string, SchemaProperty>
}

// Primary options are the main visual features; everything else is advanced
const PRIMARY_KEYS = new Set([
  'eyes',
  'eyebrows',
  'mouth',
  'hair',
  'nose',
  'head',
  'base',
  'features',
  'beard',
  'skinColor',
  'hairColor',
  'eyesColor',
  'mouthColor',
  'backgroundColor',
])

function isColorProperty(prop: SchemaProperty): boolean {
  return (
    prop.type === 'array' &&
    prop.items?.type === 'string' &&
    typeof prop.items.pattern === 'string' &&
    prop.items.pattern.includes('a-fA-F0-9')
  )
}

function isEnumProperty(prop: SchemaProperty): boolean {
  return prop.type === 'array' && prop.items?.type === 'string' && Array.isArray(prop.items.enum)
}

function isProbabilityProperty(prop: SchemaProperty): boolean {
  return prop.type === 'integer' && prop.minimum === 0 && prop.maximum === 100
}

// -- Hook: load schema for a DiceBear style at runtime --

function useStyleSchema(style: LocalAvatarStyle) {
  const [schema, setSchema] = useState<StyleSchema | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const mod = await STYLE_IMPORTS[style]()
        if (!cancelled && mod.schema?.properties) {
          setSchema(mod.schema as StyleSchema)
        }
      } catch {
        if (!cancelled) setSchema(null)
      }
    }

    setSchema(null)
    load()
    return () => {
      cancelled = true
    }
  }, [style])

  return schema
}

// -- Hook: generate avatar preview locally --

function useAvatarPreview(style: LocalAvatarStyle, seed: string, options: Record<string, unknown>) {
  const [svgUri, setSvgUri] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const { createAvatar } = await import('@dicebear/core')
        const styleModule = await STYLE_IMPORTS[style]()
        const avatar = createAvatar(styleModule as never, { seed, ...options })
        const svg = avatar.toString()
        if (!cancelled) {
          setSvgUri(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
        }
      } catch {
        if (!cancelled) setSvgUri('')
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [style, seed, options])

  return svgUri
}

// -- Sub-components for option controls --

type OptionControlProps = {
  name: string
  prop: SchemaProperty
  value: unknown
  onChange: (name: string, value: unknown) => void
}

function ColorControl({ name, prop, value, onChange }: OptionControlProps) {
  const currentColors = Array.isArray(value) ? value : ((prop.default as string[]) ?? [])
  const displayColor = currentColors[0] ?? '000000'

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
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
      <SelectTrigger className="h-8 text-xs">
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
        checked={current > 0}
        onCheckedChange={(checked: boolean) => onChange(name, checked ? 100 : 0)}
      />
      <span className="text-xs text-muted-foreground">
        {current > 0 ? m.avatar_option_enabled() : m.avatar_option_disabled()}
      </span>
    </div>
  )
}

function formatOptionLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

type OptionsFormProps = {
  schema: StyleSchema
  options: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
}

function OptionsForm({ schema, options, onChange }: OptionsFormProps) {
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
              <Label className="text-xs font-medium">{formatOptionLabel(key)}</Label>
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

// -- Main page component --

function ProfileSettingsPage() {
  const { data: session } = useSession()
  const user = session?.user

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [fullName, setFullName] = useState('')
  const [fullNameCustomized, setFullNameCustomized] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState<LocalAvatarStyle>('lorelei')
  const [avatarSeed, setAvatarSeed] = useState('')
  const [avatarOptions, setAvatarOptions] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const styleSchema = useStyleSchema(avatarStyle)

  // Load user profile data
  useEffect(() => {
    if (!user) return
    const currentUser = user

    async function loadProfile() {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) throw new Error('fetch failed')
        const data = (await res.json()) as UserProfile
        applyProfileData(data, currentUser)
      } catch {
        applyFallback(currentUser)
      }
    }

    function applyProfileData(data: UserProfile, u: { id: string; name: string | null }) {
      setFirstName(data.firstName ?? '')
      setLastName(data.lastName ?? '')
      setFullName(data.fullName ?? u.name ?? '')
      setFullNameCustomized(data.fullNameCustomized ?? false)
      setAvatarSeed(data.avatarSeed ?? u.id)
      if (data.avatarStyle && isAvatarStyle(data.avatarStyle)) setAvatarStyle(data.avatarStyle)
      if (data.avatarOptions && typeof data.avatarOptions === 'object') {
        setAvatarOptions(data.avatarOptions)
      }
      setLoaded(true)
    }

    function applyFallback(u: { id: string; name: string | null }) {
      setFullName(u.name ?? '')
      setAvatarSeed(u.id)
      setLoaded(true)
    }

    loadProfile()
  }, [user])

  // Auto-update fullName when firstName/lastName changes (unless manually customized)
  useEffect(() => {
    if (!loaded) return
    if (!fullNameCustomized) {
      const computed = [firstName, lastName].filter(Boolean).join(' ')
      if (computed) {
        setFullName(computed)
      }
    }
  }, [firstName, lastName, fullNameCustomized, loaded])

  const effectiveSeed = avatarSeed || user?.id || 'default'
  const avatarPreview = useAvatarPreview(avatarStyle, effectiveSeed, avatarOptions)
  const cdnUrl = buildDiceBearUrl(avatarStyle, effectiveSeed, avatarOptions)
  const urlTooLong = cdnUrl.length > 2000

  function handleFullNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFullName(e.target.value)
    setFullNameCustomized(true)
  }

  function handleOptionChange(name: string, value: unknown) {
    setAvatarOptions((prev) => ({ ...prev, [name]: value }))
  }

  function handleRandomize() {
    setAvatarSeed(crypto.randomUUID())
    setAvatarOptions({})
  }

  function handleStyleChange(v: string) {
    if (isAvatarStyle(v)) {
      setAvatarStyle(v)
      setAvatarOptions({})
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          fullName,
          avatarSeed: avatarSeed || undefined,
          avatarStyle: avatarStyle as AvatarStyle,
          avatarOptions,
          image: cdnUrl,
        }),
      })

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null)
        toast.error(isErrorWithMessage(data) ? data.message : m.avatar_save_error())
        return
      }

      // Refresh session so navbar avatar updates immediately
      await authClient.getSession({ fetchOptions: { cache: 'no-cache' } })
      toast.success(m.avatar_save_success())
    } catch {
      toast.error(m.avatar_save_error())
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{m.profile_title()}</CardTitle>
          <CardDescription>{m.profile_description()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{m.profile_first_name()}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFirstName(e.target.value)
                  }
                  placeholder={m.profile_first_name()}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{m.profile_last_name()}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  placeholder={m.profile_last_name()}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">{m.profile_display_name()}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={handleFullNameChange}
                placeholder={m.profile_display_name()}
                disabled={saving}
                required
              />
              {fullNameCustomized && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setFullNameCustomized(false)}
                >
                  {m.profile_sync_name()}
                </button>
              )}
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? m.profile_saving() : m.profile_save()}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.avatar_title()}</CardTitle>
          <CardDescription>{m.avatar_description()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex shrink-0 flex-col items-center gap-3">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={m.avatar_preview_alt()}
                  className="size-24 rounded-full border"
                />
              ) : (
                <div className="size-24 animate-pulse rounded-full bg-muted" />
              )}
              <Button type="button" variant="outline" size="sm" onClick={handleRandomize}>
                <Dices className="mr-2 size-4" />
                {m.avatar_randomize()}
              </Button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatarStyle">{m.avatar_style_label()}</Label>
                <Select value={avatarStyle} onValueChange={handleStyleChange}>
                  <SelectTrigger id="avatarStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVATAR_STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarSeed">{m.avatar_seed_label()}</Label>
                <Input
                  id="avatarSeed"
                  value={avatarSeed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAvatarSeed(e.target.value)
                  }
                  placeholder={user.id}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">{m.avatar_seed_hint()}</p>
              </div>
            </div>
          </div>

          {styleSchema && (
            <OptionsForm
              schema={styleSchema}
              options={avatarOptions}
              onChange={handleOptionChange}
            />
          )}

          {urlTooLong && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{m.avatar_url_length_warning()}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {cdnUrl.length} / 2000
              </Badge>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving || urlTooLong}>
            {saving ? m.profile_saving() : m.profile_save()}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
