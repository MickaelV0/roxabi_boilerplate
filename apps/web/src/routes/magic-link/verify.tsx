import { Button } from '@repo/ui'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/authClient'
import { requireGuest } from '@/lib/routeGuards'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../../components/AuthLayout'

type VerifySearch = {
  token?: string
}

export const Route = createFileRoute('/magic-link/verify')({
  beforeLoad: requireGuest,
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

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    let isMounted = true

    async function verify(t: string) {
      try {
        const { error } = await authClient.magicLink.verify({ query: { token: t } })
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

  return status
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

function ErrorState({ token }: { token: string | undefined }) {
  return (
    <AuthLayout title={m.auth_magic_link_verify_title()}>
      <div className="text-center space-y-4">
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {!token ? m.auth_missing_token() : m.auth_magic_link_verify_failed()}
        </p>
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="underline hover:text-foreground">
            {m.auth_back_to_sign_in()}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

function MagicLinkVerifyPage() {
  const { token } = Route.useSearch()
  const status = useVerifyMagicLink(token)

  if (status === 'loading') return <VerifyingState />
  if (status === 'success') return <SuccessState />

  return <ErrorState token={token} />
}
