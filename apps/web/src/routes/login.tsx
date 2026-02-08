import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@repo/ui'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: signInError } = await authClient.signIn.email({ email, password })
      if (signInError) {
        setError(signInError.message ?? 'Sign in failed')
      } else {
        navigate({ to: '/' })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { error: mlError } = await authClient.signIn.magicLink({ email: magicLinkEmail })
      if (mlError) {
        setError(mlError.message ?? 'Failed to send magic link')
      } else {
        setMessage('Check your email for a magic link.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    await authClient.signIn.social({ provider })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          {message && <p className="text-sm text-muted-foreground text-center">{message}</p>}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" type="button" onClick={() => handleOAuth('google')}>
              Google
            </Button>
            <Button variant="outline" type="button" onClick={() => handleOAuth('github')}>
              GitHub
            </Button>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-2">
            <Label htmlFor="magic-email">Magic Link</Label>
            <div className="flex gap-2">
              <Input
                id="magic-email"
                type="email"
                placeholder="your@email.com"
                value={magicLinkEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMagicLinkEmail(e.target.value)
                }
                required
              />
              <Button type="submit" variant="outline" disabled={loading}>
                Send
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="/register" className="underline hover:text-foreground">
              Register
            </a>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <a href="/reset-password" className="underline hover:text-foreground">
              Forgot password?
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
