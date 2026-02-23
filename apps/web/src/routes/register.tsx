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
import { useState } from 'react'
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
  name: string
  setName: (v: string) => void
  email: string
  emailError: string
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEmailBlur: () => void
  password: string
  setPassword: (v: string) => void
  acceptedTerms: boolean
  setAcceptedTerms: (v: boolean) => void
  loading: boolean
  error: string
  onSubmit: (e: React.FormEvent) => void
  hasOAuth: boolean
  providers: { google?: boolean; github?: boolean }
  oauthLoading: string | null
  onOAuth: (provider: 'google' | 'github') => void
  redirectParam?: string
}

function RegistrationPasswordField({
  password,
  setPassword,
  loading,
}: {
  password: string
  setPassword: (v: string) => void
  loading: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="password">{m.auth_password()}</Label>
      <PasswordInput
        id="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
  name,
  setName,
  email,
  emailError,
  onEmailChange,
  onEmailBlur,
  password,
  setPassword,
  acceptedTerms,
  setAcceptedTerms,
  loading,
  onSubmit,
}: Pick<
  RegistrationFormProps,
  | 'name'
  | 'setName'
  | 'email'
  | 'emailError'
  | 'onEmailChange'
  | 'onEmailBlur'
  | 'password'
  | 'setPassword'
  | 'acceptedTerms'
  | 'setAcceptedTerms'
  | 'loading'
  | 'onSubmit'
>) {
  return (
    <form onSubmit={onSubmit} aria-busy={loading} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{m.auth_name()}</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{m.auth_email()}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={onEmailChange}
          onBlur={onEmailBlur}
          required
          disabled={loading}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && (
          <p id="email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>
      <RegistrationPasswordField password={password} setPassword={setPassword} loading={loading} />
      <div className="flex items-start gap-2">
        <Checkbox
          id="accept-terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
          disabled={loading}
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
      <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
        {loading ? m.auth_creating_account() : m.auth_create_account_button()}
      </Button>
    </form>
  )
}

function RegistrationForm(props: RegistrationFormProps) {
  return (
    <AuthLayout title={m.auth_register_title()} description={m.auth_register_desc()}>
      {props.error && (
        <FormMessage variant="error" className="justify-center">
          {props.error}
        </FormMessage>
      )}

      <RegistrationFields
        name={props.name}
        setName={props.setName}
        email={props.email}
        emailError={props.emailError}
        onEmailChange={props.onEmailChange}
        onEmailBlur={props.onEmailBlur}
        password={props.password}
        setPassword={props.setPassword}
        acceptedTerms={props.acceptedTerms}
        setAcceptedTerms={props.setAcceptedTerms}
        loading={props.loading}
        onSubmit={props.onSubmit}
      />

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
                loading={props.oauthLoading === 'google'}
                disabled={props.loading || props.oauthLoading !== null}
                onClick={() => props.onOAuth('google')}
              >
                {m.auth_sign_up_with_google()}
              </OAuthButton>
            )}
            {props.providers.github && (
              <OAuthButton
                provider="github"
                loading={props.oauthLoading === 'github'}
                disabled={props.loading || props.oauthLoading !== null}
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

function useRegisterState() {
  const { redirect: redirectParam } = Route.useSearch()
  const providers = Route.useLoaderData()
  const hasOAuth = providers.google || providers.github
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [emailError, setEmailError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  return {
    redirectParam,
    providers,
    hasOAuth,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    message,
    setMessage,
    loading,
    setLoading,
    oauthLoading,
    setOauthLoading,
    emailError,
    setEmailError,
    acceptedTerms,
    setAcceptedTerms,
  }
}

function useRegisterHandlers(state: ReturnType<typeof useRegisterState>) {
  function handleEmailBlur() {
    if (state.email && !EMAIL_REGEX.test(state.email)) state.setEmailError(m.auth_email_invalid())
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    state.setEmail(e.target.value)
    if (state.emailError) state.setEmailError('')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    state.setError('')
    state.setMessage('')
    if (state.email && !EMAIL_REGEX.test(state.email)) {
      state.setEmailError(m.auth_email_invalid())
      return
    }
    state.setLoading(true)
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: state.name,
        email: state.email,
        password: state.password,
        locale: navigator.language?.split('-')[0] ?? 'en',
      } as Parameters<typeof authClient.signUp.email>[0])
      if (signUpError) {
        if (signUpError.code === 'USER_ALREADY_EXISTS') {
          state.setError(m.auth_register_email_exists())
        } else {
          state.setError(m.auth_register_unable())
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
        }).catch(() => {})
        toast.success(m.auth_toast_account_created())
        state.setMessage(m.auth_check_email_verify())
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      state.setLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    state.setOauthLoading(provider)
    try {
      await authClient.signIn.social({ provider })
    } catch {
      toast.error(m.auth_toast_error())
      state.setOauthLoading(null)
    }
  }

  return { handleEmailBlur, handleEmailChange, handleRegister, handleOAuth }
}

function RegisterPage() {
  const state = useRegisterState()
  const handlers = useRegisterHandlers(state)

  if (state.message) {
    return <RegistrationSuccess message={state.message} redirectParam={state.redirectParam} />
  }

  return (
    <RegistrationForm
      name={state.name}
      setName={state.setName}
      email={state.email}
      emailError={state.emailError}
      onEmailChange={handlers.handleEmailChange}
      onEmailBlur={handlers.handleEmailBlur}
      password={state.password}
      setPassword={state.setPassword}
      acceptedTerms={state.acceptedTerms}
      setAcceptedTerms={state.setAcceptedTerms}
      loading={state.loading}
      error={state.error}
      onSubmit={handlers.handleRegister}
      hasOAuth={state.hasOAuth}
      providers={state.providers}
      oauthLoading={state.oauthLoading}
      onOAuth={handlers.handleOAuth}
      redirectParam={state.redirectParam}
    />
  )
}
