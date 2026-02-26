import { Button } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/authClient'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../../components/AuthLayout'

type VerifySearch = {
  token?: string
}

export const Route = createFileRoute('/magic-link/verify')({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: MagicLinkVerifyPage,
  head: () => ({
    meta: [{ title: `${m.auth_magic_link_verify_title()} | Roxabi` }],
  }),
})

function useVerifyMagicLink(token: string | undefined) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorCode, setErrorCode] = useState<string>('UNKNOWN')

  useEffect(() => {
    if (!token) {
      setErrorCode('NO_TOKEN')
      setStatus('error')
      return
    }

    let isMounted = true

    async function verify(t: string) {
      try {
        const { error } = await authClient.magicLink.verify({ query: { token: t } })
        if (!isMounted) return
        if (error) {
          const code = error.code || error.message || 'UNKNOWN'
          setErrorCode(code)
          setStatus('error')
        } else {
          setStatus('success')
        }
      } catch {
        if (isMounted) {
          setErrorCode('UNKNOWN')
          setStatus('error')
        }
      }
    }

    verify(token)
    return () => {
      isMounted = false
    }
  }, [token])

  return { status, errorCode }
}

function VerifyingState() {
  return (
    <AuthLayout title={m.auth_magic_link_verify_title()}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{m.auth_magic_link_verifying()}</p>
      </div>
    </AuthLayout>
  )
}

function SuccessState() {
  const navigate = useNavigate()

  useEffect(() => {
    toast.success(m.auth_magic_link_verified_title())
    const timer = setTimeout(() => {
      navigate({ to: '/dashboard' })
    }, 1500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <AuthLayout title={m.auth_magic_link_verified_title()}>
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">{m.auth_magic_link_verified()}</p>
        <Button asChild className="w-full">
          <Link to="/dashboard">{m.auth_continue_to_app()}</Link>
        </Button>
      </div>
    </AuthLayout>
  )
}

function ErrorState({ errorCode }: { errorCode: string }) {
  const errorMessage = getErrorMessage(errorCode)
  const showRequestNewLink = errorCode === 'EXPIRED_TOKEN'

  return (
    <AuthLayout title={m.auth_magic_link_verify_title()}>
      <div className="text-center space-y-4">
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errorMessage}
        </p>
        {showRequestNewLink ? (
          <Button asChild className="w-full">
            <Link to="/login">{m.auth_magic_link_request_new()}</Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="underline hover:text-foreground">
              {m.auth_back_to_sign_in()}
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'NO_TOKEN':
      return m.auth_missing_token()
    case 'EXPIRED_TOKEN':
      return m.auth_magic_link_expired()
    case 'INVALID_TOKEN':
      return m.auth_magic_link_invalid()
    default:
      return m.auth_magic_link_unknown_error()
  }
}

function WarningState({ email }: { email: string }) {
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await authClient.signOut()
      window.location.reload()
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <AuthLayout title={m.auth_magic_link_verify_title()}>
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {m.auth_magic_link_already_signed_in({ email })}
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={handleSignOut} disabled={signingOut} className="w-full">
            {signingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              m.auth_magic_link_sign_out_first()
            )}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">{m.auth_magic_link_go_to_dashboard()}</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}

function MagicLinkVerifyPage() {
  const { token } = Route.useSearch()
  const { data: session } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (session && !token) {
      navigate({ to: '/dashboard' })
    }
  }, [session, token, navigate])

  // Session + token: show warning
  if (session && token) {
    return <WarningState email={session.user.email} />
  }

  // Session + no token: redirecting (handled by useEffect above)
  if (session && !token) {
    return null
  }

  // No session: proceed with verification
  return <GuestVerifyFlow token={token} />
}

function GuestVerifyFlow({ token }: { token: string | undefined }) {
  const { status, errorCode } = useVerifyMagicLink(token)

  if (status === 'loading') return <VerifyingState />
  if (status === 'success') return <SuccessState />

  return <ErrorState errorCode={errorCode} />
}
