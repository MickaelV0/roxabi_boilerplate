import {
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
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'

const AVATAR_STYLES = [
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'bottts', label: 'Bottts' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'thumbs', label: 'Thumbs' },
  { value: 'avataaars', label: 'Avataaars' },
] as const

type AvatarStyle = (typeof AVATAR_STYLES)[number]['value']

type ProfileData = {
  firstName?: string
  lastName?: string
  fullName?: string
  fullNameCustomized?: boolean
  avatarSeed?: string
  avatarStyle?: string
}

export const Route = createFileRoute('/settings/profile')({
  component: ProfileSettingsPage,
  head: () => ({
    meta: [{ title: 'Profile Settings | Roxabi' }],
  }),
})

function useAvatarPreview(style: AvatarStyle, seed: string) {
  const [svgUri, setSvgUri] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const { createAvatar } = await import('@dicebear/core')
        const styleModule = await STYLE_IMPORTS[style]()
        // DiceBear style modules export { create, meta, schema } matching Style<Options>
        // but TS cannot structurally match namespace imports to the Style interface
        const avatar = createAvatar(styleModule as never, { seed })
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
  }, [style, seed])

  return svgUri
}

const STYLE_IMPORTS = {
  lorelei: () => import('@dicebear/lorelei'),
  bottts: () => import('@dicebear/bottts'),
  'pixel-art': () => import('@dicebear/pixel-art'),
  thumbs: () => import('@dicebear/thumbs'),
  avataaars: () => import('@dicebear/avataaars'),
} as const

function ProfileSettingsPage() {
  const { data: session } = useSession()
  const user = session?.user

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [fullName, setFullName] = useState('')
  const [fullNameCustomized, setFullNameCustomized] = useState(false)
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('lorelei')
  const [avatarSeed, setAvatarSeed] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load user profile data
  useEffect(() => {
    if (!user) return
    const currentUser = user

    async function loadProfile() {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' })
        if (!res.ok) throw new Error('fetch failed')
        const data = (await res.json()) as ProfileData
        applyProfileData(data, currentUser)
      } catch {
        applyFallback(currentUser)
      }
    }

    function applyProfileData(data: ProfileData, u: { id: string; name: string | null }) {
      setFirstName(data.firstName ?? '')
      setLastName(data.lastName ?? '')
      setFullName(data.fullName ?? u.name ?? '')
      setFullNameCustomized(data.fullNameCustomized ?? false)
      setAvatarSeed(data.avatarSeed ?? u.id)
      const validStyle = AVATAR_STYLES.find((s) => s.value === data.avatarStyle)
      if (validStyle) setAvatarStyle(validStyle.value)
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

  const avatarPreview = useAvatarPreview(avatarStyle, avatarSeed || user?.id || 'default')

  function handleFullNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFullName(e.target.value)
    setFullNameCustomized(true)
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
          avatarStyle,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        toast.error(data?.message ?? 'Failed to update profile')
        return
      }

      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
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
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your name and display preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFirstName(e.target.value)
                  }
                  placeholder="First name"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  placeholder="Last name"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Display Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={handleFullNameChange}
                placeholder="Display name"
                disabled={saving}
                required
              />
              {fullNameCustomized && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setFullNameCustomized(false)}
                >
                  Sync from first/last name
                </button>
              )}
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Choose a generated avatar style. The avatar is generated from a style and a seed value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex shrink-0 items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="size-24 rounded-full border"
                />
              ) : (
                <div className="size-24 animate-pulse rounded-full bg-muted" />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatarStyle">Style</Label>
                <Select
                  value={avatarStyle}
                  onValueChange={(v: string) => {
                    if (AVATAR_STYLES.some((s) => s.value === v)) {
                      setAvatarStyle(v as AvatarStyle)
                    }
                  }}
                >
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
                <Label htmlFor="avatarSeed">Seed</Label>
                <Input
                  id="avatarSeed"
                  value={avatarSeed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAvatarSeed(e.target.value)
                  }
                  placeholder={user.id}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Different seeds generate different avatars. Leave empty to use your user ID.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
