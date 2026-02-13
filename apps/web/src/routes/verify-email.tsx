import { Button } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'

type VerifySearch = {
  token?: string
}

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: VerifyEmailPage,
  head: () => ({
    meta: [{ title: `${m.auth_verify_email_title()} | Roxabi` }],
  }),
})

function VerifyEmailPage() {
  const { token } = Route.useSearch()
  const { data: session } = useSession()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [resending, setResending] = useState(false)
  const sessionEmail = session?.user?.email

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    async function verify(t: string) {
      try {
        const { error } = await authClient.verifyEmail({ query: { token: t } })
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
        }
      } catch {
        setStatus('error')
      }
    }

    verify(token)
  }, [token])

  async function handleResend() {
    if (!sessionEmail) return
    setResending(true)
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: sessionEmail,
        callbackURL: `${window.location.origin}/verify-email`,
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.auth_toast_verification_resent())
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setResending(false)
    }
  }

  if (status === 'loading') {
    return (
      <AuthLayout title={m.auth_verify_email_title()} description={m.auth_verify_email_desc()}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{m.auth_verifying_email()}</p>
        </div>
      </AuthLayout>
    )
  }

  if (status === 'success') {
    return (
      <AuthLayout title={m.auth_email_verified_title()}>
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{m.auth_email_verified()}</p>
          <Button asChild className="w-full">
            <Link to="/">{m.auth_continue_to_app()}</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={m.auth_verify_email_title()}>
      <div className="text-center space-y-4">
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {!token ? m.auth_missing_token() : m.auth_verification_failed()}
        </p>
        {sessionEmail && (
          <Button variant="outline" onClick={handleResend} disabled={resending} className="w-full">
            {resending ? m.auth_resending() : m.auth_resend_verification()}
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="underline hover:text-foreground">
            {m.auth_back_to_sign_in()}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
