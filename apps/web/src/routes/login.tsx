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
import { fetchUserProfile } from '@/lib/api'
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

// ---------------------------------------------------------------------------
// Custom hook: useLoginFormState
// ---------------------------------------------------------------------------

function useLoginFormFields() {
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

  return {
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

function useLoginFormState() {
  const fields = useLoginFormFields()

  function submitStart() {
    fields.setError('')
    fields.setEmailNotVerified(false)
    fields.setLoading(true)
  }

  function submitError(msg: string) {
    fields.setError(msg)
    fields.setLoading(false)
  }

  function decrementResendCooldown() {
    fields.setResendCooldown((c) => c - 1)
  }

  function markEmailNotVerified(emailAddr: string) {
    fields.setEmailNotVerified(true)
    fields.setNotVerifiedEmail(emailAddr)
  }

  return { ...fields, submitStart, submitError, decrementResendCooldown, markEmailNotVerified }
}

type LoginFormState = ReturnType<typeof useLoginFormState>

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

function PasswordLoginForm({
  email,
  password,
  rememberMe,
  loading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
}: {
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onRememberMeChange: (v: boolean) => void
}) {
  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{m.auth_email()}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPasswordChange(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => onRememberMeChange(checked === true)}
        />
        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
          {m.auth_remember_me()}
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? m.auth_signing_in() : m.auth_sign_in_button()}
      </Button>
    </form>
  )
}

function OAuthSection({
  providers,
  loading,
  oauthLoading,
  onOAuth,
}: {
  providers: { google?: boolean; github?: boolean }
  loading: boolean
  oauthLoading: string | null
  onOAuth: (provider: 'google' | 'github') => void
}) {
  return (
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
  )
}

function PasswordLoginTab({
  email,
  password,
  rememberMe,
  loading,
  oauthLoading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  hasOAuth,
  providers,
  onOAuth,
}: {
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  oauthLoading: string | null
  onSubmit: (e: React.FormEvent) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onRememberMeChange: (v: boolean) => void
  hasOAuth: boolean
  providers: { google?: boolean; github?: boolean }
  onOAuth: (provider: 'google' | 'github') => void
}) {
  return (
    <TabsContent value="password" className="space-y-6 pt-4">
      <PasswordLoginForm
        email={email}
        password={password}
        rememberMe={rememberMe}
        loading={loading}
        onSubmit={onSubmit}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onRememberMeChange={onRememberMeChange}
      />

      {hasOAuth && (
        <OAuthSection
          providers={providers}
          loading={loading}
          oauthLoading={oauthLoading}
          onOAuth={onOAuth}
        />
      )}
    </TabsContent>
  )
}

function MagicLinkTab({
  magicLinkEmail,
  loading,
  onSubmit,
  onMagicLinkEmailChange,
}: {
  magicLinkEmail: string
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onMagicLinkEmailChange: (v: string) => void
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onMagicLinkEmailChange(e.target.value)
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

function useResendCooldownEffect(resendCooldown: number, decrementResendCooldown: () => void) {
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => decrementResendCooldown(), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown, decrementResendCooldown])
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

// ---------------------------------------------------------------------------
// Handler factories (accept form state + only the slices they need)
// ---------------------------------------------------------------------------

type AuthHandlerDeps = {
  form: LoginFormState
  navigate: ReturnType<typeof useNavigate>
  redirectParam: string | undefined
}

function createLoginAuthHandlers(deps: AuthHandlerDeps) {
  const { form, navigate, redirectParam } = deps

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    form.submitStart()
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      })
      if (signInError) {
        handleSignInError(signInError, form.email, form)
      } else {
        await handleSignInSuccess(navigate, redirectParam)
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      form.setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    form.submitStart()
    try {
      const { error: mlError } = await authClient.signIn.magicLink({
        email: form.magicLinkEmail,
      })
      if (mlError) {
        form.submitError(m.auth_magic_link_error())
      } else {
        toast.success(m.auth_toast_magic_link_sent())
        navigate({
          to: '/magic-link-sent',
          search: { email: form.magicLinkEmail, redirect: redirectParam },
        })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      form.setLoading(false)
    }
  }

  return { handleEmailLogin, handleMagicLink }
}

/**
 * Handle sign-in API error.
 * Better Auth returns 403 specifically for unverified email when
 * emailAndPassword.requireEmailVerification is enabled.
 */
function handleSignInError(signInError: { status: number }, email: string, form: LoginFormState) {
  if (signInError.status === 403) {
    form.markEmailNotVerified(email)
  } else {
    form.submitError(m.auth_login_invalid_credentials())
  }
}

/** Handle successful sign-in: check soft-delete, then navigate. */
async function handleSignInSuccess(
  navigate: ReturnType<typeof useNavigate>,
  redirectParam: string | undefined
) {
  toast.success(m.auth_toast_signed_in())
  const redirected = await checkSoftDeletedAccount(navigate)
  if (redirected) return
  navigate({ to: safeRedirect(redirectParam) })
}

type SecondaryHandlerDeps = {
  form: LoginFormState
  redirectParam: string | undefined
}

function createLoginSecondaryHandlers(deps: SecondaryHandlerDeps) {
  const { form, redirectParam } = deps

  async function handleResendVerification() {
    if (!form.notVerifiedEmail) return
    form.setResendLoading(true)
    try {
      await authClient.sendVerificationEmail({
        email: form.notVerifiedEmail,
        callbackURL: `${window.location.origin}/verify-email`,
      })
      toast.success(m.auth_toast_verification_resent())
      form.setResendCooldown(COOLDOWN_SECONDS)
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      form.setResendLoading(false)
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
    form.setOauthLoading(provider)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirectParam
          ? `/login?redirect=${encodeURIComponent(redirectParam)}`
          : undefined,
      })
    } catch {
      toast.error(m.auth_toast_error())
      form.setOauthLoading(null)
    }
  }

  return { handleResendVerification, handleOAuth }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function useLoginPage() {
  const navigate = useNavigate()
  const { redirect: redirectParam } = Route.useSearch()
  const providers = Route.useLoaderData()
  const hasOAuth = providers.google || providers.github
  const form = useLoginFormState()

  useResendCooldownEffect(form.resendCooldown, form.decrementResendCooldown)
  useStoredRedirect(navigate)

  const authHandlers = createLoginAuthHandlers({
    form,
    navigate,
    redirectParam,
  })

  const secondaryHandlers = createLoginSecondaryHandlers({
    form,
    redirectParam,
  })

  return { form, providers, hasOAuth, redirectParam, authHandlers, secondaryHandlers }
}

function LoginPageAlerts({
  emailNotVerified,
  resendCooldown,
  resendLoading,
  error,
  onResend,
}: {
  emailNotVerified: boolean
  resendCooldown: number
  resendLoading: boolean
  error: string
  onResend: () => void
}) {
  return (
    <>
      {emailNotVerified && (
        <UnverifiedEmailAlert
          resendCooldown={resendCooldown}
          resendLoading={resendLoading}
          onResend={onResend}
        />
      )}

      {error && (
        <FormMessage variant="error" className="justify-center">
          {error}
        </FormMessage>
      )}
    </>
  )
}

function LoginPage() {
  const { form, providers, hasOAuth, redirectParam, authHandlers, secondaryHandlers } =
    useLoginPage()

  return (
    <AuthLayout title={m.auth_sign_in_title()} description={m.auth_sign_in_desc()}>
      <LoginPageAlerts
        emailNotVerified={form.emailNotVerified}
        resendCooldown={form.resendCooldown}
        resendLoading={form.resendLoading}
        error={form.error}
        onResend={secondaryHandlers.handleResendVerification}
      />

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">{m.auth_tab_password()}</TabsTrigger>
          <TabsTrigger value="magic-link">{m.auth_tab_magic_link()}</TabsTrigger>
        </TabsList>

        <PasswordLoginTab
          email={form.email}
          password={form.password}
          rememberMe={form.rememberMe}
          loading={form.loading}
          oauthLoading={form.oauthLoading}
          onSubmit={authHandlers.handleEmailLogin}
          onEmailChange={form.setEmail}
          onPasswordChange={form.setPassword}
          onRememberMeChange={form.setRememberMe}
          hasOAuth={hasOAuth}
          providers={providers}
          onOAuth={secondaryHandlers.handleOAuth}
        />

        <MagicLinkTab
          magicLinkEmail={form.magicLinkEmail}
          loading={form.loading}
          onSubmit={authHandlers.handleMagicLink}
          onMagicLinkEmailChange={form.setMagicLinkEmail}
        />
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
