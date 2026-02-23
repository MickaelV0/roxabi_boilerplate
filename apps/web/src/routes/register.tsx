import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  FormMessage,
  Input,
  Label,
  OAuthButton,
  PasswordInput,
} from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle } from 'lucide-react'
import { useReducer } from 'react'
import { toast } from 'sonner'
import { legalConfig } from '@/config/legal.config'
import { authClient, fetchEnabledProviders } from '@/lib/auth-client'
import { requireGuest } from '@/lib/route-guards'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'
import { OrDivider } from '../components/OrDivider'

type RegisterSearch = {
  redirect?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Route = createFileRoute('/register')({
  beforeLoad: requireGuest,
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  loader: fetchEnabledProviders,
  component: RegisterPage,
  head: () => ({
    meta: [{ title: `${m.auth_register_title()} | Roxabi` }],
  }),
})

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

type RegisterState = {
  name: string
  email: string
  password: string
  error: string
  message: string
  loading: boolean
  oauthLoading: string | null
  emailError: string
  acceptedTerms: boolean
}

const initialState: RegisterState = {
  name: '',
  email: '',
  password: '',
  error: '',
  message: '',
  loading: false,
  oauthLoading: null,
  emailError: '',
  acceptedTerms: false,
}

type RegisterAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OAUTH_LOADING'; payload: string | null }
  | { type: 'SET_EMAIL_ERROR'; payload: string }
  | { type: 'SET_ACCEPTED_TERMS'; payload: boolean }
  | { type: 'CLEAR_ERRORS' }

function registerReducer(state: RegisterState, action: RegisterAction): RegisterState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload }
    case 'SET_EMAIL':
      return { ...state, email: action.payload }
    case 'SET_PASSWORD':
      return { ...state, password: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_MESSAGE':
      return { ...state, message: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_OAUTH_LOADING':
      return { ...state, oauthLoading: action.payload }
    case 'SET_EMAIL_ERROR':
      return { ...state, emailError: action.payload }
    case 'SET_ACCEPTED_TERMS':
      return { ...state, acceptedTerms: action.payload }
    case 'CLEAR_ERRORS':
      return { ...state, error: '', message: '' }
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RegistrationSuccess({
  message,
  redirectParam,
}: {
  message: string
  redirectParam?: string
}) {
  return (
    <AuthLayout title={m.auth_register_title()} description={m.auth_register_desc()}>
      <Card className="border-0 shadow-none">
        <CardHeader className="items-center text-center">
          <CheckCircle className="size-12 text-success" aria-hidden="true" />
          <CardTitle className="text-lg">{m.auth_register_success_title()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link
            to="/login"
            search={redirectParam ? { redirect: redirectParam } : undefined}
            className="inline-block text-sm underline hover:text-foreground text-muted-foreground"
          >
            {m.auth_back_to_sign_in()}
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

type RegistrationFormProps = {
  state: RegisterState
  dispatch: React.Dispatch<RegisterAction>
  onSubmit: (e: React.FormEvent) => void
  hasOAuth: boolean
  providers: { google?: boolean; github?: boolean }
  onOAuth: (provider: 'google' | 'github') => void
  redirectParam?: string
}

function RegistrationPasswordField({
  password,
  dispatch,
  loading,
}: {
  password: string
  dispatch: React.Dispatch<RegisterAction>
  loading: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="password">{m.auth_password()}</Label>
      <PasswordInput
        id="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          dispatch({ type: 'SET_PASSWORD', payload: e.target.value })
        }
        required
        disabled={loading}
        showStrength
        strengthLabels={{
          weak: m.password_strength_weak(),
          fair: m.password_strength_fair(),
          good: m.password_strength_good(),
          strong: m.password_strength_strong(),
        }}
        ruleLabels={{
          minLength: m.password_rule_min_length(),
          uppercase: m.password_rule_uppercase(),
          number: m.password_rule_number(),
          symbol: m.password_rule_symbol(),
        }}
        toggleLabels={{
          show: m.password_toggle_show(),
          hide: m.password_toggle_hide(),
        }}
      />
    </div>
  )
}

function RegistrationFields({
  state,
  dispatch,
  onSubmit,
}: {
  state: RegisterState
  dispatch: React.Dispatch<RegisterAction>
  onSubmit: (e: React.FormEvent) => void
}) {
  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: 'SET_EMAIL', payload: e.target.value })
    if (state.emailError) dispatch({ type: 'SET_EMAIL_ERROR', payload: '' })
  }

  function handleEmailBlur() {
    if (state.email && !EMAIL_REGEX.test(state.email)) {
      dispatch({ type: 'SET_EMAIL_ERROR', payload: m.auth_email_invalid() })
    }
  }

  return (
    <form onSubmit={onSubmit} aria-busy={state.loading} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{m.auth_name()}</Label>
        <Input
          id="name"
          type="text"
          value={state.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            dispatch({ type: 'SET_NAME', payload: e.target.value })
          }
          required
          disabled={state.loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{m.auth_email()}</Label>
        <Input
          id="email"
          type="email"
          value={state.email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          required
          disabled={state.loading}
          aria-invalid={state.emailError ? true : undefined}
          aria-describedby={state.emailError ? 'email-error' : undefined}
        />
        {state.emailError && (
          <p id="email-error" className="text-sm text-destructive">
            {state.emailError}
          </p>
        )}
      </div>
      <RegistrationPasswordField
        password={state.password}
        dispatch={dispatch}
        loading={state.loading}
      />
      <div className="flex items-start gap-2">
        <Checkbox
          id="accept-terms"
          checked={state.acceptedTerms}
          onCheckedChange={(checked) =>
            dispatch({ type: 'SET_ACCEPTED_TERMS', payload: checked === true })
          }
          disabled={state.loading}
        />
        <Label htmlFor="accept-terms" className="text-sm font-normal leading-snug cursor-pointer">
          <span>
            {m.auth_accept_privacy_prefix()}{' '}
            <Link
              to="/legal/confidentialite"
              className="underline hover:text-foreground"
              target="_blank"
            >
              {m.auth_accept_privacy_policy()}
            </Link>{' '}
            {m.auth_accept_terms_and()}{' '}
            <Link to="/legal/cgu" className="underline hover:text-foreground" target="_blank">
              {m.auth_accept_terms_of_service()}
            </Link>
          </span>
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={state.loading || !state.acceptedTerms}>
        {state.loading ? m.auth_creating_account() : m.auth_create_account_button()}
      </Button>
    </form>
  )
}

function RegistrationForm(props: RegistrationFormProps) {
  return (
    <AuthLayout title={m.auth_register_title()} description={m.auth_register_desc()}>
      {props.state.error && (
        <FormMessage variant="error" className="justify-center">
          {props.state.error}
        </FormMessage>
      )}

      <RegistrationFields state={props.state} dispatch={props.dispatch} onSubmit={props.onSubmit} />

      {props.hasOAuth && (
        <>
          <OrDivider />
          <div
            className={cn(
              'grid gap-2',
              props.providers.google && props.providers.github ? 'grid-cols-2' : 'grid-cols-1'
            )}
          >
            {props.providers.google && (
              <OAuthButton
                provider="google"
                loading={props.state.oauthLoading === 'google'}
                disabled={props.state.loading || props.state.oauthLoading !== null}
                onClick={() => props.onOAuth('google')}
              >
                {m.auth_sign_up_with_google()}
              </OAuthButton>
            )}
            {props.providers.github && (
              <OAuthButton
                provider="github"
                loading={props.state.oauthLoading === 'github'}
                disabled={props.state.loading || props.state.oauthLoading !== null}
                onClick={() => props.onOAuth('github')}
              >
                {m.auth_sign_up_with_github()}
              </OAuthButton>
            )}
          </div>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {m.auth_have_account()}{' '}
        <Link
          to="/login"
          search={props.redirectParam ? { redirect: props.redirectParam } : undefined}
          className="underline hover:text-foreground"
        >
          {m.auth_sign_in_link()}
        </Link>
      </p>
    </AuthLayout>
  )
}

// ---------------------------------------------------------------------------
// Handlers (module-level async functions — keeps the page component small)
// ---------------------------------------------------------------------------

async function handleRegister(state: RegisterState, dispatch: React.Dispatch<RegisterAction>) {
  dispatch({ type: 'CLEAR_ERRORS' })
  if (state.email && !EMAIL_REGEX.test(state.email)) {
    dispatch({ type: 'SET_EMAIL_ERROR', payload: m.auth_email_invalid() })
    return
  }
  dispatch({ type: 'SET_LOADING', payload: true })
  try {
    const { error: signUpError } = await authClient.signUp.email({
      name: state.name,
      email: state.email,
      password: state.password,
      // locale is declared in Better Auth's user.additionalFields but the client SDK types
      // don't reflect additional fields in signUp params — the `as` cast is required.
      locale: navigator.language?.split('-')[0] ?? 'en',
    } as Parameters<typeof authClient.signUp.email>[0])
    if (signUpError) {
      // Conscious UX trade-off: revealing that an email is already registered enables account
      // enumeration, but provides a significantly better user experience than a generic error.
      // Mitigated by rate limiting on sign-up.
      if (signUpError.code === 'USER_ALREADY_EXISTS') {
        dispatch({ type: 'SET_ERROR', payload: m.auth_register_email_exists() })
      } else {
        dispatch({ type: 'SET_ERROR', payload: m.auth_register_unable() })
      }
    } else {
      fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          categories: { necessary: true, analytics: false, marketing: false },
          policyVersion: legalConfig.consentPolicyVersion,
          action: 'customized',
        }),
      }).catch(() => {
        /* Consent sync failure is non-critical */
      })
      toast.success(m.auth_toast_account_created())
      dispatch({ type: 'SET_MESSAGE', payload: m.auth_check_email_verify() })
    }
  } catch {
    toast.error(m.auth_toast_error())
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false })
  }
}

async function handleOAuth(
  provider: 'google' | 'github',
  dispatch: React.Dispatch<RegisterAction>
) {
  dispatch({ type: 'SET_OAUTH_LOADING', payload: provider })
  try {
    await authClient.signIn.social({ provider })
  } catch {
    toast.error(m.auth_toast_error())
    dispatch({ type: 'SET_OAUTH_LOADING', payload: null })
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function RegisterPage() {
  const { redirect: redirectParam } = Route.useSearch()
  const providers = Route.useLoaderData()
  const hasOAuth = providers.google || providers.github
  const [state, dispatch] = useReducer(registerReducer, initialState)

  if (state.message) {
    return <RegistrationSuccess message={state.message} redirectParam={redirectParam} />
  }

  return (
    <RegistrationForm
      state={state}
      dispatch={dispatch}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault()
        handleRegister(state, dispatch)
      }}
      hasOAuth={hasOAuth}
      providers={providers}
      onOAuth={(provider) => handleOAuth(provider, dispatch)}
      redirectParam={redirectParam}
    />
  )
}
