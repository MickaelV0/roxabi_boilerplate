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
import { useEffect, useReducer } from 'react'
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

// ---------------------------------------------------------------------------
// State types & reducer
// ---------------------------------------------------------------------------

type LoginState = {
  email: string
  password: string
  magicLinkEmail: string
  rememberMe: boolean
  error: string
  loading: boolean
  oauthLoading: string | null
  emailNotVerified: boolean
  notVerifiedEmail: string
  resendCooldown: number
  resendLoading: boolean
}

type LoginAction =
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_MAGIC_LINK_EMAIL'; payload: string }
  | { type: 'SET_REMEMBER_ME'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OAUTH_LOADING'; payload: string | null }
  | { type: 'SET_EMAIL_NOT_VERIFIED'; payload: { verified: boolean; email?: string } }
  | { type: 'SET_RESEND_COOLDOWN'; payload: number }
  | { type: 'DECREMENT_RESEND_COOLDOWN' }
  | { type: 'SET_RESEND_LOADING'; payload: boolean }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_ERROR'; payload: string }

const initialLoginState: LoginState = {
  email: '',
  password: '',
  magicLinkEmail: '',
  rememberMe: false,
  error: '',
  loading: false,
  oauthLoading: null,
  emailNotVerified: false,
  notVerifiedEmail: '',
  resendCooldown: 0,
  resendLoading: false,
}

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload }
    case 'SET_PASSWORD':
      return { ...state, password: action.payload }
    case 'SET_MAGIC_LINK_EMAIL':
      return { ...state, magicLinkEmail: action.payload }
    case 'SET_REMEMBER_ME':
      return { ...state, rememberMe: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_OAUTH_LOADING':
      return { ...state, oauthLoading: action.payload }
    case 'SET_EMAIL_NOT_VERIFIED':
      return {
        ...state,
        emailNotVerified: action.payload.verified,
        notVerifiedEmail: action.payload.email ?? state.notVerifiedEmail,
      }
    case 'SET_RESEND_COOLDOWN':
      return { ...state, resendCooldown: action.payload }
    case 'DECREMENT_RESEND_COOLDOWN':
      return { ...state, resendCooldown: state.resendCooldown - 1 }
    case 'SET_RESEND_LOADING':
      return { ...state, resendLoading: action.payload }
    case 'SUBMIT_START':
      return { ...state, error: '', emailNotVerified: false, loading: true }
    case 'SUBMIT_ERROR':
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

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

function PasswordLoginForm({
  email,
  password,
  rememberMe,
  loading,
  onSubmit,
  dispatch,
}: {
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  dispatch: React.Dispatch<LoginAction>
}) {
  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{m.auth_email()}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({ type: 'SET_EMAIL', payload: e.target.value })
          }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({ type: 'SET_PASSWORD', payload: e.target.value })
          }
          required
          disabled={loading}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) =>
            dispatch({ type: 'SET_REMEMBER_ME', payload: checked === true })
          }
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
  onSubmit,
  hasOAuth,
  providers,
  oauthLoading,
  dispatch,
  onOAuth,
}: {
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  hasOAuth: boolean
  providers: { google?: boolean; github?: boolean }
  oauthLoading: string | null
  dispatch: React.Dispatch<LoginAction>
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
        dispatch={dispatch}
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
  dispatch,
}: {
  magicLinkEmail: string
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  dispatch: React.Dispatch<LoginAction>
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
              dispatch({ type: 'SET_MAGIC_LINK_EMAIL', payload: e.target.value })
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

function useResendCooldownEffect(resendCooldown: number, dispatch: React.Dispatch<LoginAction>) {
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => dispatch({ type: 'DECREMENT_RESEND_COOLDOWN' }), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown, dispatch])
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
// Handler hooks (accept dispatch + only the state slices they need)
// ---------------------------------------------------------------------------

type AuthHandlerDeps = {
  dispatch: React.Dispatch<LoginAction>
  email: string
  password: string
  rememberMe: boolean
  magicLinkEmail: string
  navigate: ReturnType<typeof useNavigate>
  redirectParam: string | undefined
}

function useLoginAuthHandlers(deps: AuthHandlerDeps) {
  const { dispatch, email, password, rememberMe, navigate, redirectParam } = deps

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ type: 'SUBMIT_START' })
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })
      if (signInError) {
        handleSignInError(signInError, email, dispatch)
      } else {
        await handleSignInSuccess(navigate, redirectParam)
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ type: 'SUBMIT_START' })
    try {
      const { error: mlError } = await authClient.signIn.magicLink({
        email: deps.magicLinkEmail,
      })
      if (mlError) {
        dispatch({ type: 'SUBMIT_ERROR', payload: m.auth_magic_link_error() })
      } else {
        toast.success(m.auth_toast_magic_link_sent())
        navigate({
          to: '/magic-link-sent',
          search: { email: deps.magicLinkEmail, redirect: redirectParam },
        })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return { handleEmailLogin, handleMagicLink }
}

/**
 * Handle sign-in API error.
 * Better Auth returns 403 specifically for unverified email when
 * emailAndPassword.requireEmailVerification is enabled.
 */
function handleSignInError(
  signInError: { status: number },
  email: string,
  dispatch: React.Dispatch<LoginAction>
) {
  if (signInError.status === 403) {
    dispatch({ type: 'SET_EMAIL_NOT_VERIFIED', payload: { verified: true, email } })
  } else {
    dispatch({ type: 'SUBMIT_ERROR', payload: m.auth_login_invalid_credentials() })
  }
}

/** Handle successful sign-in: check soft-delete, auto-select org, navigate. */
async function handleSignInSuccess(
  navigate: ReturnType<typeof useNavigate>,
  redirectParam: string | undefined
) {
  toast.success(m.auth_toast_signed_in())
  const redirected = await checkSoftDeletedAccount(navigate)
  if (redirected) return
  await autoSelectOrg()
  navigate({ to: safeRedirect(redirectParam) })
}

type SecondaryHandlerDeps = {
  dispatch: React.Dispatch<LoginAction>
  notVerifiedEmail: string
  redirectParam: string | undefined
}

function useLoginSecondaryHandlers(deps: SecondaryHandlerDeps) {
  const { dispatch, notVerifiedEmail, redirectParam } = deps

  async function handleResendVerification() {
    if (!notVerifiedEmail) return
    dispatch({ type: 'SET_RESEND_LOADING', payload: true })
    try {
      await authClient.sendVerificationEmail({
        email: notVerifiedEmail,
        callbackURL: `${window.location.origin}/verify-email`,
      })
      toast.success(m.auth_toast_verification_resent())
      dispatch({ type: 'SET_RESEND_COOLDOWN', payload: COOLDOWN_SECONDS })
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      dispatch({ type: 'SET_RESEND_LOADING', payload: false })
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
    dispatch({ type: 'SET_OAUTH_LOADING', payload: provider })
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirectParam
          ? `/login?redirect=${encodeURIComponent(redirectParam)}`
          : undefined,
      })
    } catch {
      toast.error(m.auth_toast_error())
      dispatch({ type: 'SET_OAUTH_LOADING', payload: null })
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
  const [state, dispatch] = useReducer(loginReducer, initialLoginState)

  useResendCooldownEffect(state.resendCooldown, dispatch)
  useStoredRedirect(navigate)

  const authHandlers = useLoginAuthHandlers({
    dispatch,
    email: state.email,
    password: state.password,
    rememberMe: state.rememberMe,
    magicLinkEmail: state.magicLinkEmail,
    navigate,
    redirectParam,
  })

  const secondaryHandlers = useLoginSecondaryHandlers({
    dispatch,
    notVerifiedEmail: state.notVerifiedEmail,
    redirectParam,
  })

  return { state, dispatch, providers, hasOAuth, redirectParam, authHandlers, secondaryHandlers }
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
  const { state, dispatch, providers, hasOAuth, redirectParam, authHandlers, secondaryHandlers } =
    useLoginPage()

  return (
    <AuthLayout title={m.auth_sign_in_title()} description={m.auth_sign_in_desc()}>
      <LoginPageAlerts
        emailNotVerified={state.emailNotVerified}
        resendCooldown={state.resendCooldown}
        resendLoading={state.resendLoading}
        error={state.error}
        onResend={secondaryHandlers.handleResendVerification}
      />

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">{m.auth_tab_password()}</TabsTrigger>
          <TabsTrigger value="magic-link">{m.auth_tab_magic_link()}</TabsTrigger>
        </TabsList>

        <PasswordLoginTab
          email={state.email}
          password={state.password}
          rememberMe={state.rememberMe}
          loading={state.loading}
          onSubmit={authHandlers.handleEmailLogin}
          hasOAuth={hasOAuth}
          providers={providers}
          oauthLoading={state.oauthLoading}
          dispatch={dispatch}
          onOAuth={secondaryHandlers.handleOAuth}
        />

        <MagicLinkTab
          magicLinkEmail={state.magicLinkEmail}
          loading={state.loading}
          onSubmit={authHandlers.handleMagicLink}
          dispatch={dispatch}
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
