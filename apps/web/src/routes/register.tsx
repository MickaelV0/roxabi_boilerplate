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
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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
        setMessage('Check your email to verify your account.')
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
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Register for a new account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          {message && <p className="text-sm text-muted-foreground text-center">{message}</p>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
              />
            </div>
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
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
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

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="underline hover:text-foreground">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
