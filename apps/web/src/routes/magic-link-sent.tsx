import { Button } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

// TODO: import AuthLayout from '@/components/AuthLayout'
// TODO: import authClient from '@/lib/auth-client'
// TODO: import toast from 'sonner'
// TODO: import Paraglide messages

export const Route = createFileRoute('/magic-link-sent')({
  component: MagicLinkSentPage,
})

/**
 * Magic Link Sent confirmation page.
 *
 * Shows "Check your email" message with the email address.
 * Provides "Didn't receive it?" resend option.
 */
function MagicLinkSentPage() {
  // TODO: read email from router state or search params
  // TODO: implement resend magic link via authClient.signIn.magicLink()
  // TODO: implement cooldown timer for resend button
  // TODO: implement loading state for resend
  // TODO: implement i18n with Paraglide messages

  const [_loading, _setLoading] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* TODO: replace with <AuthLayout title="Check Your Email"> */}
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold">Check Your Email</h1>
        {/* TODO: show email address from state */}
        <p className="text-muted-foreground">
          We sent a magic link to your email. Click the link to sign in.
        </p>
        {/* TODO: "Didn't receive it?" resend button */}
        <Button variant="outline" disabled>
          Resend magic link
        </Button>
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="underline hover:text-foreground">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
