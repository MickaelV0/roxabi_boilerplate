import { Button, Input, Label, OAuthButton, PasswordInput } from '@repo/ui'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (data) {
      throw redirect({ to: '/' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      })
      if (signUpError) {
        setError(signUpError.message ?? 'Registration failed')
      } else {
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

  return (
    <AuthLayout title={m.auth_register_title()} description={m.auth_register_desc()}>
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive text-center">
          {error}
        </p>
      )}
      {message && (
        <p aria-live="polite" className="text-sm text-muted-foreground text-center">
          {message}
        </p>
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
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
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? m.auth_creating_account() : m.auth_create_account_button()}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{m.auth_or()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <OAuthButton
          provider="google"
          loading={oauthLoading === 'google'}
          disabled={loading || oauthLoading !== null}
          onClick={() => handleOAuth('google')}
        >
          {m.auth_sign_up_with_google()}
        </OAuthButton>
        <OAuthButton
          provider="github"
          loading={oauthLoading === 'github'}
          disabled={loading || oauthLoading !== null}
          onClick={() => handleOAuth('github')}
        >
          {m.auth_sign_up_with_github()}
        </OAuthButton>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {m.auth_have_account()}{' '}
        <Link to="/login" className="underline hover:text-foreground">
          {m.auth_sign_in_link()}
        </Link>
      </p>
    </AuthLayout>
  )
}
