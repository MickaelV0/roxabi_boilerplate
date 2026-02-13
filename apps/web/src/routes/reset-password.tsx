import { Button, Input, Label } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: `${m.auth_reset_password_title()} | Roxabi` }],
  }),
})

function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { error: resetError } = await authClient.requestPasswordReset({ email })
      if (resetError) {
        setError(resetError.message ?? 'Failed to send reset email')
      } else {
        toast.success(m.auth_toast_reset_link_sent())
        setMessage(m.auth_check_email_reset())
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={m.auth_reset_password_title()} description={m.auth_reset_password_desc()}>
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

      <form onSubmit={handleRequestReset} aria-busy={loading} className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? m.auth_sending() : m.auth_send_reset_link()}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {m.auth_remember_password()}{' '}
        <Link to="/login" className="underline hover:text-foreground">
          {m.auth_sign_in_link()}
        </Link>
      </p>
    </AuthLayout>
  )
}
