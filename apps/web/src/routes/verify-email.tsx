import { Button, Input, Label } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'

const COOLDOWN_SECONDS = 60

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
  const [resendEmail, setResendEmail] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [sessionlessMessage, setSessionlessMessage] = useState('')
  const sessionEmail = session?.user?.email

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    let isMounted = true

    async function verify(t: string) {
      try {
        const { error } = await authClient.verifyEmail({ query: { token: t } })
        if (!isMounted) return
        setStatus(error ? 'error' : 'success')
      } catch {
        if (isMounted) setStatus('error')
      }
    }

    verify(token)
    return () => {
      isMounted = false
    }
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
        setCooldown(COOLDOWN_SECONDS)
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setResending(false)
    }
  }

  async function handleSessionlessResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendEmail) return
    setResending(true)
    setSessionlessMessage('')
    try {
      await authClient.sendVerificationEmail({
        email: resendEmail,
        callbackURL: `${window.location.origin}/verify-email`,
      })
      // Always show neutral message regardless of result (no account existence leak)
      setSessionlessMessage(m.auth_verify_email_resend_neutral())
      setCooldown(COOLDOWN_SECONDS)
    } catch {
      // Still show neutral message even on errors to avoid information leakage
      setSessionlessMessage(m.auth_verify_email_resend_neutral())
      setCooldown(COOLDOWN_SECONDS)
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
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full"
          >
            {resending
              ? m.auth_resending()
              : cooldown > 0
                ? m.auth_resend_in({ seconds: String(cooldown) })
                : m.auth_resend_verification()}
          </Button>
        )}
        {!sessionEmail && (
          <div className="space-y-3">
            <form onSubmit={handleSessionlessResend} aria-busy={resending} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="resend-email">{m.auth_verify_email_enter_email()}</Label>
                <Input
                  id="resend-email"
                  type="email"
                  value={resendEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setResendEmail(e.target.value)
                  }
                  required
                  disabled={resending}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={resending || cooldown > 0}
              >
                {resending
                  ? m.auth_resending()
                  : cooldown > 0
                    ? m.auth_resend_in({ seconds: String(cooldown) })
                    : m.auth_resend_verification()}
              </Button>
            </form>
            {sessionlessMessage && (
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {sessionlessMessage}
              </p>
            )}
          </div>
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
