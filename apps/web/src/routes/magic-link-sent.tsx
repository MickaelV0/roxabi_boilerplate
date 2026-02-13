import { Button } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'
import { AuthLayout } from '../components/AuthLayout'

type MagicLinkSearch = {
  email?: string
}

const COOLDOWN_SECONDS = 60

export const Route = createFileRoute('/magic-link-sent')({
  validateSearch: (search: Record<string, unknown>): MagicLinkSearch => ({
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: MagicLinkSentPage,
  head: () => ({
    meta: [{ title: `${m.auth_magic_link_sent_title()} | Roxabi` }],
  }),
})

function MagicLinkSentPage() {
  const { email } = Route.useSearch()
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleResend() {
    if (!email) return
    setLoading(true)
    try {
      const { error } = await authClient.signIn.magicLink({ email })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.auth_toast_magic_link_resent())
        setCooldown(COOLDOWN_SECONDS)
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setLoading(false)
    }
  }

  const canResend = !loading && cooldown <= 0

  return (
    <AuthLayout title={m.auth_magic_link_sent_title()} description={m.auth_magic_link_sent_desc()}>
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {email ? m.auth_magic_link_sent_message({ email }) : m.auth_check_email_magic_link()}
        </p>

        {email && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{m.auth_didnt_receive()}</p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={!canResend}
              className="w-full"
            >
              {loading
                ? m.auth_sending()
                : cooldown > 0
                  ? m.auth_resend_in({ seconds: String(cooldown) })
                  : m.auth_resend_magic_link()}
            </Button>
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
