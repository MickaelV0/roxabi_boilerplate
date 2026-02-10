import { Button, Label, PasswordInput } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../../components/AuthLayout'

type ConfirmSearch = {
  token?: string
}

export const Route = createFileRoute('/reset-password/confirm')({
  validateSearch: (search: Record<string, unknown>): ConfirmSearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordConfirmPage,
})

function ResetPasswordConfirmPage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <AuthLayout title={m.auth_reset_confirm_title()} description={m.auth_reset_confirm_desc()}>
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">{m.auth_missing_token()}</p>
          <Button asChild variant="outline">
            <Link to="/reset-password">{m.auth_request_new_reset()}</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      })
      if (resetError) {
        setError(resetError.message ?? m.auth_invalid_reset_link())
      } else {
        toast.success(m.auth_toast_password_updated())
        navigate({ to: '/login' })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={m.auth_reset_confirm_title()} description={m.auth_reset_confirm_desc()}>
      {error && (
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button asChild variant="link" className="h-auto p-0">
            <Link to="/reset-password">{m.auth_request_new_reset()}</Link>
          </Button>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">{m.auth_new_password()}</Label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            disabled={loading}
            showStrength
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? m.auth_resetting_password() : m.auth_reset_password_button()}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="underline hover:text-foreground">
          {m.auth_back_to_sign_in()}
        </Link>
      </p>
    </AuthLayout>
  )
}
