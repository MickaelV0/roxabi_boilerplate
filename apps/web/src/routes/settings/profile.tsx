import type { AvatarStyle, UserProfile } from '@repo/types'
import { AVATAR_STYLES } from '@repo/types'
import {
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
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Dices } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { OptionsForm } from '@/components/avatar/OptionsForm'
import { authClient, useSession } from '@/lib/auth-client'
import { buildDiceBearUrl } from '@/lib/avatar/buildDiceBearUrl'
import { AVATAR_STYLE_LABELS } from '@/lib/avatar/constants'
import { isAvatarStyle } from '@/lib/avatar/helpers'
import { useAvatarPreview, useStyleSchema } from '@/lib/avatar/hooks'
import { isErrorWithMessage } from '@/lib/error-utils'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/settings/profile')({
  component: ProfileSettingsPage,
  head: () => ({
    meta: [{ title: 'Profile Settings | Roxabi' }],
  }),
})

// -- Main page component --

function ProfileSettingsPage() {
  const { data: session } = useSession()
  const user = session?.user

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [fullName, setFullName] = useState('')
  const [fullNameCustomized, setFullNameCustomized] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('lorelei')
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
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          fullName,
          avatarSeed: avatarSeed || undefined,
          avatarStyle,
          avatarOptions,
          image: cdnUrl,
        }),
      })

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null)
        toast.error(isErrorWithMessage(data) ? data.message : m.avatar_save_error())
        return
      }

      // Update Better Auth session so navbar avatar reflects the change immediately.
      // updateUser triggers $sessionSignal which makes useSession() refetch.
      try {
        await authClient.updateUser({ image: cdnUrl })
      } catch {
        // Session update failed — avatar will update on next page load
      }
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
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{m.profile_title()}</CardTitle>
          <CardDescription>{m.profile_description()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{m.profile_first_name()}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
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
                    {AVATAR_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {AVATAR_STYLE_LABELS[style]}
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
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? m.profile_saving() : m.profile_save()}
      </Button>
    </form>
  )
}
