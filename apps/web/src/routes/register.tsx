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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Route = createFileRoute('/register')({
  beforeLoad: requireGuest,
  loader: fetchEnabledProviders,
  component: RegisterPage,
  head: () => ({
    meta: [{ title: `${m.auth_register_title()} | Roxabi` }],
  }),
})

function RegisterPage() {
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

  function handleEmailBlur() {
    if (email && !EMAIL_REGEX.test(email)) {
      setEmailError(m.auth_email_invalid())
    }
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError('')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (email && !EMAIL_REGEX.test(email)) {
      setEmailError(m.auth_email_invalid())
      return
    }

    setLoading(true)
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      })
      if (signUpError) {
        if (signUpError.code === 'USER_ALREADY_EXISTS') {
          setError(m.auth_register_email_exists())
        } else {
          setError(m.auth_register_unable())
        }
      } else {
        // Sync GDPR consent to server (non-blocking)
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
          // Consent sync failure is non-critical
        })
        toast.success(m.auth_toast_account_created())
        setMessage(m.auth_check_email_verify())
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider)
    try {
      await authClient.signIn.social({ provider })
    } catch {
      toast.error(m.auth_toast_error())
      setOauthLoading(null)
    }
  }

  if (message) {
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
              className="inline-block text-sm underline hover:text-foreground text-muted-foreground"
            >
              {m.auth_back_to_sign_in()}
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={m.auth_register_title()} description={m.auth_register_desc()}>
      {error && (
        <FormMessage variant="error" className="justify-center">
          {error}
        </FormMessage>
      )}

      <form onSubmit={handleRegister} aria-busy={loading} className="space-y-4">
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
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
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
        <div className="flex items-start gap-2">
          <Checkbox
            id="accept-terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            disabled={loading}
          />
          <Label htmlFor="accept-terms" className="text-sm font-normal leading-snug cursor-pointer">
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
          </Label>
        </div>
        <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
          {loading ? m.auth_creating_account() : m.auth_create_account_button()}
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
                {m.auth_sign_up_with_google()}
              </OAuthButton>
            )}
            {providers.github && (
              <OAuthButton
                provider="github"
                loading={oauthLoading === 'github'}
                disabled={loading || oauthLoading !== null}
                onClick={() => handleOAuth('github')}
              >
                {m.auth_sign_up_with_github()}
              </OAuthButton>
            )}
          </div>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {m.auth_have_account()}{' '}
        <Link to="/login" className="underline hover:text-foreground">
          {m.auth_sign_in_link()}
        </Link>
      </p>
    </AuthLayout>
  )
}
