import { Button, Checkbox, Input, Label, OAuthButton, PasswordInput } from '@repo/ui'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient, fetchEnabledProviders } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (data) {
      throw redirect({ to: '/' })
    }
  },
  loader: fetchEnabledProviders,
  component: LoginPage,
  head: () => ({
    meta: [{ title: `${m.auth_sign_in_title()} | Roxabi` }],
  }),
})

function LoginPage() {
  const navigate = useNavigate()
  const providers = Route.useLoaderData()
  const hasOAuth = providers.google || providers.github
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })
      if (signInError) {
        setError(signInError.message ?? 'Sign in failed')
      } else {
        toast.success(m.auth_toast_signed_in())
        navigate({ to: '/' })
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
        setError(mlError.message ?? 'Failed to send magic link')
      } else {
        toast.success(m.auth_toast_magic_link_sent())
        navigate({
          to: '/magic-link-sent',
          search: { email: magicLinkEmail },
        })
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

  return (
    <AuthLayout title={m.auth_sign_in_title()} description={m.auth_sign_in_desc()}>
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive text-center">
          {error}
        </p>
      )}

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
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{m.auth_or()}</span>
            </div>
          </div>

          <div
            className={`grid gap-2 ${providers.google && providers.github ? 'grid-cols-2' : 'grid-cols-1'}`}
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

      <form onSubmit={handleMagicLink} aria-busy={loading} className="space-y-2">
        <Label htmlFor="magic-email">{m.auth_magic_link()}</Label>
        <div className="flex gap-2">
          <Input
            id="magic-email"
            type="email"
            placeholder={m.auth_magic_link_placeholder()}
            value={magicLinkEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMagicLinkEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" variant="outline" disabled={loading}>
            {m.auth_send_magic_link()}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {m.auth_no_account()}{' '}
        <Link to="/register" className="underline hover:text-foreground">
          {m.auth_register_link()}
        </Link>
      </p>
    </AuthLayout>
  )
}
