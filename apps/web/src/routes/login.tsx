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

function UnverifiedEmailAlert({
  resendCooldown,
  resendLoading,
  onResend,
}: {
  resendCooldown: number
  resendLoading: boolean
  onResend: () => void
}) {
  return (
    <Alert variant="warning">
      <AlertDescription className="space-y-2 text-center">
        <p>{m.auth_login_email_not_verified_sent()}</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 underline"
          onClick={onResend}
          disabled={resendCooldown > 0 || resendLoading}
        >
          {resendCooldown > 0
            ? m.auth_resend_in({ seconds: String(resendCooldown) })
            : m.auth_resend_verification()}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function PasswordLoginTab({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  loading,
  onSubmit,
  hasOAuth,
  providers,
  oauthLoading,
  onOAuth,
}: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  rememberMe: boolean
  setRememberMe: (v: boolean) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  hasOAuth: boolean
  providers: { google?: boolean; github?: boolean }
  oauthLoading: string | null
  onOAuth: (provider: 'google' | 'github') => void
}) {
  return (
    <TabsContent value="password" className="space-y-6 pt-4">
      <form onSubmit={onSubmit} aria-busy={loading} className="space-y-4">
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
                onClick={() => onOAuth('google')}
              >
                {m.auth_sign_in_with_google()}
              </OAuthButton>
            )}
            {providers.github && (
              <OAuthButton
                provider="github"
                loading={oauthLoading === 'github'}
                disabled={loading || oauthLoading !== null}
                onClick={() => onOAuth('github')}
              >
                {m.auth_sign_in_with_github()}
              </OAuthButton>
            )}
          </div>
        </>
      )}
    </TabsContent>
  )
}

function MagicLinkTab({
  magicLinkEmail,
  setMagicLinkEmail,
  loading,
  onSubmit,
}: {
  magicLinkEmail: string
  setMagicLinkEmail: (v: string) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <TabsContent value="magic-link" className="space-y-6 pt-4">
      <form onSubmit={onSubmit} aria-busy={loading} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="magic-email">{m.auth_email()}</Label>
          <Input
            id="magic-email"
            type="email"
            placeholder={m.auth_magic_link_placeholder()}
            value={magicLinkEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMagicLinkEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? m.auth_sending() : m.auth_send_magic_link()}
        </Button>
      </form>
    </TabsContent>
  )
}

/** Checks if account is soft-deleted and navigates to reactivation if so. */
async function checkSoftDeletedAccount(navigate: ReturnType<typeof useNavigate>): Promise<boolean> {
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

function useResendCooldownEffect(
  resendCooldown: number,
  setResendCooldown: (fn: (c: number) => number) => void
) {
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown, setResendCooldown])
}

function useStoredRedirect(navigate: ReturnType<typeof useNavigate>) {
  useEffect(() => {
    try {
      const storedRedirect = sessionStorage.getItem('auth_redirect')
      if (storedRedirect) {
        sessionStorage.removeItem('auth_redirect')
        const target = safeRedirect(storedRedirect)
        if (target !== '/dashboard') navigate({ to: target })
      }
    } catch {
      // sessionStorage may be unavailable
    }
  }, [navigate])
}

function useLoginState() {
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

  useResendCooldownEffect(resendCooldown, setResendCooldown)
  useStoredRedirect(navigate)

  return {
    navigate,
    redirectParam,
    providers,
    hasOAuth,
    email,
    setEmail,
    password,
    setPassword,
    magicLinkEmail,
    setMagicLinkEmail,
    rememberMe,
    setRememberMe,
    error,
    setError,
    loading,
    setLoading,
    oauthLoading,
    setOauthLoading,
    emailNotVerified,
    setEmailNotVerified,
    notVerifiedEmail,
    setNotVerifiedEmail,
    resendCooldown,
    setResendCooldown,
    resendLoading,
    setResendLoading,
  }
}

type LoginState = ReturnType<typeof useLoginState>

function useLoginAuthHandlers(state: LoginState) {
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    state.setError('')
    state.setEmailNotVerified(false)
    state.setLoading(true)
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: state.email,
        password: state.password,
        rememberMe: state.rememberMe,
      })
      if (signInError) {
        if (signInError.status === 403) {
          state.setEmailNotVerified(true)
          state.setNotVerifiedEmail(state.email)
        } else {
          state.setError(m.auth_login_invalid_credentials())
        }
      } else {
        toast.success(m.auth_toast_signed_in())
        const redirected = await checkSoftDeletedAccount(state.navigate)
        if (redirected) return
        await autoSelectOrg()
        state.navigate({ to: safeRedirect(state.redirectParam) })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      state.setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    state.setError('')
    state.setLoading(true)
    try {
      const { error: mlError } = await authClient.signIn.magicLink({
        email: state.magicLinkEmail,
      })
      if (mlError) {
        state.setError(m.auth_magic_link_error())
      } else {
        toast.success(m.auth_toast_magic_link_sent())
        state.navigate({
          to: '/magic-link-sent',
          search: { email: state.magicLinkEmail, redirect: state.redirectParam },
        })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      state.setLoading(false)
    }
  }

  return { handleEmailLogin, handleMagicLink }
}

function useLoginSecondaryHandlers(state: LoginState) {
  async function handleResendVerification() {
    if (!state.notVerifiedEmail) return
    state.setResendLoading(true)
    try {
      await authClient.sendVerificationEmail({
        email: state.notVerifiedEmail,
        callbackURL: `${window.location.origin}/verify-email`,
      })
      toast.success(m.auth_toast_verification_resent())
      state.setResendCooldown(COOLDOWN_SECONDS)
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      state.setResendLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    if (state.redirectParam) {
      try {
        sessionStorage.setItem('auth_redirect', state.redirectParam)
      } catch {
        // sessionStorage may be unavailable
      }
    }
    state.setOauthLoading(provider)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: state.redirectParam
          ? `/login?redirect=${encodeURIComponent(state.redirectParam)}`
          : undefined,
      })
    } catch {
      toast.error(m.auth_toast_error())
      state.setOauthLoading(null)
    }
  }

  return { handleResendVerification, handleOAuth }
}

function LoginPage() {
  const state = useLoginState()
  const authHandlers = useLoginAuthHandlers(state)
  const secondaryHandlers = useLoginSecondaryHandlers(state)

  return (
    <AuthLayout title={m.auth_sign_in_title()} description={m.auth_sign_in_desc()}>
      {state.emailNotVerified && (
        <UnverifiedEmailAlert
          resendCooldown={state.resendCooldown}
          resendLoading={state.resendLoading}
          onResend={secondaryHandlers.handleResendVerification}
        />
      )}

      {state.error && (
        <FormMessage variant="error" className="justify-center">
          {state.error}
        </FormMessage>
      )}

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">{m.auth_tab_password()}</TabsTrigger>
          <TabsTrigger value="magic-link">{m.auth_tab_magic_link()}</TabsTrigger>
        </TabsList>

        <PasswordLoginTab
          email={state.email}
          setEmail={state.setEmail}
          password={state.password}
          setPassword={state.setPassword}
          rememberMe={state.rememberMe}
          setRememberMe={state.setRememberMe}
          loading={state.loading}
          onSubmit={authHandlers.handleEmailLogin}
          hasOAuth={state.hasOAuth}
          providers={state.providers}
          oauthLoading={state.oauthLoading}
          onOAuth={secondaryHandlers.handleOAuth}
        />

        <MagicLinkTab
          magicLinkEmail={state.magicLinkEmail}
          setMagicLinkEmail={state.setMagicLinkEmail}
          loading={state.loading}
          onSubmit={authHandlers.handleMagicLink}
        />
      </Tabs>

      <p className="text-center text-sm text-muted-foreground">
        {m.auth_no_account()}{' '}
        <Link
          to="/register"
          search={state.redirectParam ? { redirect: state.redirectParam } : undefined}
          className="underline hover:text-foreground"
        >
          {m.auth_register_link()}
        </Link>
      </p>
    </AuthLayout>
  )
}
