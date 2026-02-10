import { Button, Input, Label } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

// TODO: import AuthLayout from '@/components/AuthLayout'
// TODO: import PasswordInput from '@repo/ui'
// TODO: import authClient from '@/lib/auth-client'
// TODO: import toast from 'sonner'
// TODO: import Paraglide messages

export const Route = createFileRoute('/reset-password/confirm')({
  component: ResetPasswordConfirmPage,
})

/**
 * Reset Password Confirmation page.
 *
 * Reads `token` from URL search params, allows user to set a new password.
 * Shows error for invalid/expired tokens with link to request a new reset.
 */
function ResetPasswordConfirmPage() {
  // TODO: read token from URL search params
  // TODO: handle missing token → show error
  // TODO: implement password reset submission via authClient
  // TODO: implement PasswordInput with strength indicator
  // TODO: implement loading state
  // TODO: implement success → toast + redirect to /login
  // TODO: implement error → inline error + "Request new reset" link
  // TODO: implement i18n with Paraglide messages

  const [_password, _setPassword] = useState('')
  const [_loading, _setLoading] = useState(false)
  const [_error, _setError] = useState('')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* TODO: replace with <AuthLayout title="Reset Password"> */}
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Set New Password</h1>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            {/* TODO: replace with PasswordInput showStrength */}
            <Input id="new-password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Reset password
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="underline hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
