import { Button } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

// TODO: import AuthLayout from '@/components/AuthLayout'
// TODO: import authClient from '@/lib/auth-client'
// TODO: import toast from 'sonner'
// TODO: import Paraglide messages

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
})

/**
 * Email Verification page.
 *
 * Reads `token` from URL search params and automatically submits to Better Auth.
 * Shows success/failure status with appropriate actions.
 */
function VerifyEmailPage() {
  // TODO: read token from URL search params
  // TODO: auto-submit token to Better Auth on mount (useEffect)
  // TODO: handle missing token → show error
  // TODO: implement success state → "Email verified" + continue link
  // TODO: implement error state → "Verification failed" + resend option
  // TODO: implement loading state during verification
  // TODO: implement i18n with Paraglide messages

  const [_status, _setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* TODO: replace with <AuthLayout title="Email Verification"> */}
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold">Verify Email</h1>
        {/* TODO: show loading spinner while verifying */}
        {/* TODO: show success message + continue button */}
        {/* TODO: show error message + resend button */}
        <p className="text-muted-foreground">Verifying your email...</p>
        <Button asChild>
          <Link to="/">Continue to app</Link>
        </Button>
      </div>
    </div>
  )
}
