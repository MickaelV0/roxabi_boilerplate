import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  cn,
  FormMessage,
  Input,
  Label,
  OAuthButton,
  PasswordInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { fetchOrganizations, fetchUserProfile } from '@/lib/api'
import { authClient, fetchEnabledProviders } from '@/lib/auth-client'
import { requireGuest, safeRedirect } from '@/lib/route-guards'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'
import { OrDivider } from '../components/OrDivider'

type LoginSearch = {
  redirect?: string
}

const COOLDOWN_SECONDS = 60

export const Route = createFileRoute('/login')({
  beforeLoad: requireGuest,
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  loader: fetchEnabledProviders,
  component: LoginPage,
  head: () => ({
    meta: [{ title: `${m.auth_sign_in_title()} | Roxabi` }],
  }),
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect: redirectParam } = Route.useSearch()
  const providers = Route.useLoaderData()
  const hasOAuth = providers.google || providers.github
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [notVerifiedEmail, setNotVerifiedEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Read redirect from sessionStorage after OAuth callback
  useEffect(() => {
    try {
      const storedRedirect = sessionStorage.getItem('auth_redirect')
      if (storedRedirect) {
        sessionStorage.removeItem('auth_redirect')
        const target = safeRedirect(storedRedirect)
        if (target !== '/dashboard') {
          navigate({ to: target })
        }
      }
    } catch {
      // sessionStorage may be unavailable (private browsing, storage quota)
    }
  }, [navigate])

  /** Checks if account is soft-deleted and navigates to reactivation if so. Returns true if redirected. */
  async function checkSoftDeletedAccount(): Promise<boolean> {
    try {
      const res = await fetchUserProfile()
      if (!res.ok) return false
      const profile = (await res.json()) as Record<string, unknown>
      if (profile.deletedAt) {
        navigate({
          to: '/account-reactivation',
          search: { deleteScheduledFor: profile.deleteScheduledFor as string | undefined },
        })
        return true
      }
    } catch {
      // Non-blocking
    }
    return false
  }

  /** Auto-select the first active org if no org is currently active (best-effort). */
  async function autoSelectOrg() {
    try {
      // Check if there is already an active org before overwriting
      const { data: currentSession } = await authClient.getSession()
      const activeOrgId = (currentSession as Record<string, unknown> | null)?.activeOrganizationId
      if (activeOrgId) return

      const res = await fetchOrganizations()
      const orgs = res.ok ? ((await res.json()) as Array<{ id: string }>) : []
      if (orgs[0]) {
        await authClient.organization.setActive({ organizationId: orgs[0].id })
      }
    } catch {
      // Non-blocking
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setEmailNotVerified(false)
    setLoading(true)
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })
      if (signInError) {
        // Better Auth returns 403 specifically for unverified email when
        // emailAndPassword.requireEmailVerification is enabled. Other 403
        // conditions (banned, etc.) use different error codes.
        if (signInError.status === 403) {
          setEmailNotVerified(true)
          setNotVerifiedEmail(email)
        } else {
          setError(m.auth_login_invalid_credentials())
        }
      } else {
        toast.success(m.auth_toast_signed_in())
        const redirected = await checkSoftDeletedAccount()
        if (redirected) return
        await autoSelectOrg()
        navigate({ to: safeRedirect(redirectParam) })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: mlError } = await authClient.signIn.magicLink({ email: magicLinkEmail })
      if (mlError) {
        setError(m.auth_magic_link_error())
      } else {
        toast.success(m.auth_toast_magic_link_sent())
        navigate({
          to: '/magic-link-sent',
          search: { email: magicLinkEmail, redirect: redirectParam },
        })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!notVerifiedEmail) return
    setResendLoading(true)
    try {
      await authClient.sendVerificationEmail({
        email: notVerifiedEmail,
        callbackURL: `${window.location.origin}/verify-email`,
      })
      toast.success(m.auth_toast_verification_resent())
      setResendCooldown(COOLDOWN_SECONDS)
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setResendLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    if (redirectParam) {
      try {
        sessionStorage.setItem('auth_redirect', redirectParam)
      } catch {
        // sessionStorage may be unavailable
      }
    }
    setOauthLoading(provider)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirectParam
          ? `/login?redirect=${encodeURIComponent(redirectParam)}`
          : undefined,
      })
    } catch {
      toast.error(m.auth_toast_error())
      setOauthLoading(null)
    }
  }

  return (
    <AuthLayout title={m.auth_sign_in_title()} description={m.auth_sign_in_desc()}>
      {emailNotVerified && (
        <Alert variant="warning">
          <AlertDescription className="space-y-2 text-center">
            <p>{m.auth_login_email_not_verified_sent()}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 underline"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || resendLoading}
            >
              {resendCooldown > 0
                ? m.auth_resend_in({ seconds: String(resendCooldown) })
                : m.auth_resend_verification()}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <FormMessage variant="error" className="justify-center">
          {error}
        </FormMessage>
      )}

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">{m.auth_tab_password()}</TabsTrigger>
          <TabsTrigger value="magic-link">{m.auth_tab_magic_link()}</TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="space-y-6 pt-4">
          <form onSubmit={handleEmailLogin} aria-busy={loading} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{m.auth_email()}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{m.auth_password()}</Label>
                <Link
                  to="/reset-password"
                  className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                  {m.auth_forgot_password()}
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                {m.auth_remember_me()}
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? m.auth_signing_in() : m.auth_sign_in_button()}
            </Button>
          </form>

          {hasOAuth && (
            <>
              <OrDivider />

              <div
                className={cn(
                  'grid gap-2',
                  providers.google && providers.github ? 'grid-cols-2' : 'grid-cols-1'
                )}
              >
                {providers.google && (
                  <OAuthButton
                    provider="google"
                    loading={oauthLoading === 'google'}
                    disabled={loading || oauthLoading !== null}
                    onClick={() => handleOAuth('google')}
                  >
                    {m.auth_sign_in_with_google()}
                  </OAuthButton>
                )}
                {providers.github && (
                  <OAuthButton
                    provider="github"
                    loading={oauthLoading === 'github'}
                    disabled={loading || oauthLoading !== null}
                    onClick={() => handleOAuth('github')}
                  >
                    {m.auth_sign_in_with_github()}
                  </OAuthButton>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="magic-link" className="space-y-6 pt-4">
          <form onSubmit={handleMagicLink} aria-busy={loading} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">{m.auth_email()}</Label>
              <Input
                id="magic-email"
                type="email"
                placeholder={m.auth_magic_link_placeholder()}
                value={magicLinkEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMagicLinkEmail(e.target.value)
                }
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? m.auth_sending() : m.auth_send_magic_link()}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground">
        {m.auth_no_account()}{' '}
        <Link
          to="/register"
          search={redirectParam ? { redirect: redirectParam } : undefined}
          className="underline hover:text-foreground"
        >
          {m.auth_register_link()}
        </Link>
      </p>
    </AuthLayout>
  )
}
