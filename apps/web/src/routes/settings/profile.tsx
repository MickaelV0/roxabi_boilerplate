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
import { useCallback, useEffect, useState } from 'react'
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

// -- Types --

type ProfileFormState = {
  firstName: string
  lastName: string
  fullName: string
  fullNameCustomized: boolean
  avatarStyle: AvatarStyle
  avatarSeed: string
  avatarOptions: Record<string, unknown>
  saving: boolean
  loaded: boolean
}

type ProfileState = ProfileFormState & {
  setFirstName: (v: string) => void
  setLastName: (v: string) => void
  setFullName: (v: string) => void
  setFullNameCustomized: (v: boolean) => void
  setAvatarStyle: (v: AvatarStyle) => void
  setAvatarSeed: (v: string) => void
  setAvatarOptions: (
    v: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)
  ) => void
  setSaving: (v: boolean) => void
}

const initialProfileForm: ProfileFormState = {
  firstName: '',
  lastName: '',
  fullName: '',
  fullNameCustomized: false,
  avatarStyle: 'lorelei',
  avatarSeed: '',
  avatarOptions: {},
  saving: false,
  loaded: false,
}

// -- Helpers --

function parseProfileResponse(
  data: UserProfile,
  fallbackName: string,
  fallbackId: string
): Partial<ProfileFormState> {
  return {
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    fullName: data.fullName ?? fallbackName,
    fullNameCustomized: data.fullNameCustomized ?? false,
    avatarStyle: data.avatarStyle && isAvatarStyle(data.avatarStyle) ? data.avatarStyle : 'lorelei',
    avatarSeed: data.avatarSeed ?? fallbackId,
    avatarOptions:
      data.avatarOptions && typeof data.avatarOptions === 'object' ? data.avatarOptions : {},
  }
}

async function fetchProfile(fallbackName: string, fallbackId: string) {
  const res = await fetch('/api/users/me', { credentials: 'include' })
  if (!res.ok) throw new Error('fetch failed')
  const data = (await res.json()) as UserProfile
  return parseProfileResponse(data, fallbackName, fallbackId)
}

// -- Custom hook --

function useProfileData(user: { id: string; name: string | null } | undefined): ProfileState {
  const [s, setS] = useState(initialProfileForm)
  const set = useCallback(
    (patch: Partial<ProfileFormState>) => setS((prev) => ({ ...prev, ...patch })),
    []
  )

  useEffect(() => {
    if (!user) return
    fetchProfile(user.name ?? '', user.id)
      .then((p) => set({ ...p, loaded: true }))
      .catch(() => set({ fullName: user.name ?? '', avatarSeed: user.id, loaded: true }))
  }, [user, set])

  useEffect(() => {
    if (!s.loaded || s.fullNameCustomized) return
    const computed = [s.firstName, s.lastName].filter(Boolean).join(' ')
    if (computed) set({ fullName: computed })
  }, [s.firstName, s.lastName, s.fullNameCustomized, s.loaded, set])

  const setFirstName = useCallback((v: string) => set({ firstName: v }), [set])
  const setLastName = useCallback((v: string) => set({ lastName: v }), [set])
  const setFullName = useCallback((v: string) => set({ fullName: v }), [set])
  const setFullNameCustomized = useCallback((v: boolean) => set({ fullNameCustomized: v }), [set])
  const setAvatarStyle = useCallback((v: AvatarStyle) => set({ avatarStyle: v }), [set])
  const setAvatarSeed = useCallback((v: string) => set({ avatarSeed: v }), [set])
  const setAvatarOptions = useCallback(
    (v: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) =>
      setS((prev) => ({
        ...prev,
        avatarOptions: typeof v === 'function' ? v(prev.avatarOptions) : v,
      })),
    []
  )
  const setSaving = useCallback((v: boolean) => set({ saving: v }), [set])

  return {
    ...s,
    setFirstName,
    setLastName,
    setFullName,
    setFullNameCustomized,
    setAvatarStyle,
    setAvatarSeed,
    setAvatarOptions,
    setSaving,
  }
}

// -- Sub-components --

function ProfileInfoSection({ profile }: { profile: ProfileState }) {
  return (
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
              value={profile.firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                profile.setFirstName(e.target.value)
              }
              placeholder={m.profile_first_name()}
              disabled={profile.saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{m.profile_last_name()}</Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                profile.setLastName(e.target.value)
              }
              placeholder={m.profile_last_name()}
              disabled={profile.saving}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">{m.profile_display_name()}</Label>
          <Input
            id="fullName"
            value={profile.fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              profile.setFullName(e.target.value)
              profile.setFullNameCustomized(true)
            }}
            placeholder={m.profile_display_name()}
            disabled={profile.saving}
            required
          />
          {profile.fullNameCustomized && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => profile.setFullNameCustomized(false)}
            >
              {m.profile_sync_name()}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AvatarCustomizationSection({
  profile,
  userId,
}: {
  profile: ProfileState
  userId: string
}) {
  const effectiveSeed = profile.avatarSeed || userId || 'default'
  const avatarPreview = useAvatarPreview(profile.avatarStyle, effectiveSeed, profile.avatarOptions)
  const styleSchema = useStyleSchema(profile.avatarStyle)
  const cdnUrl = buildDiceBearUrl(profile.avatarStyle, effectiveSeed, profile.avatarOptions)
  const urlTooLong = cdnUrl.length > 2000

  function handleRandomize() {
    profile.setAvatarSeed(crypto.randomUUID())
    profile.setAvatarOptions({})
  }

  function handleStyleChange(v: string) {
    if (isAvatarStyle(v)) {
      profile.setAvatarStyle(v)
      profile.setAvatarOptions({})
    }
  }

  return (
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
              <Select value={profile.avatarStyle} onValueChange={handleStyleChange}>
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
                value={profile.avatarSeed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  profile.setAvatarSeed(e.target.value)
                }
                placeholder={userId}
                disabled={profile.saving}
              />
              <p className="text-xs text-muted-foreground">{m.avatar_seed_hint()}</p>
            </div>
          </div>
        </div>

        {styleSchema && (
          <OptionsForm
            schema={styleSchema}
            options={profile.avatarOptions}
            onChange={(name: string, value: unknown) =>
              profile.setAvatarOptions((prev) => ({ ...prev, [name]: value }))
            }
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
  )
}

// -- Main page component --

function ProfileSettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const profile = useProfileData(user)

  const effectiveSeed = profile.avatarSeed || user?.id || 'default'
  const cdnUrl = buildDiceBearUrl(profile.avatarStyle, effectiveSeed, profile.avatarOptions)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    profile.setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName || undefined,
          lastName: profile.lastName || undefined,
          fullName: profile.fullName,
          avatarSeed: profile.avatarSeed || undefined,
          avatarStyle: profile.avatarStyle,
          avatarOptions: profile.avatarOptions,
          image: cdnUrl,
        }),
      })

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null)
        toast.error(isErrorWithMessage(data) ? data.message : m.avatar_save_error())
        return
      }

      try {
        await authClient.updateUser({ image: cdnUrl })
      } catch {
        // Session update failed — avatar will update on next page load
      }
      toast.success(m.avatar_save_success())
    } catch {
      toast.error(m.avatar_save_error())
    } finally {
      profile.setSaving(false)
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <ProfileInfoSection profile={profile} />
      <AvatarCustomizationSection profile={profile} userId={user.id} />
      <Button type="submit" disabled={profile.saving}>
        {profile.saving ? m.profile_saving() : m.profile_save()}
      </Button>
    </form>
  )
}
