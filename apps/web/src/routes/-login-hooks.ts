import type { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { safeRedirect } from '@/lib/routeGuards'

function useLoginFormFields() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [notVerifiedEmail, setNotVerifiedEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  return {
    email,
    setEmail,
    password,
    setPassword,
    magicLinkEmail,
    setMagicLinkEmail,
    rememberMe,
    setRememberMe,
    error,
    setError,
    loading,
    setLoading,
    oauthLoading,
    setOauthLoading,
    emailNotVerified,
    setEmailNotVerified,
    notVerifiedEmail,
    setNotVerifiedEmail,
    resendCooldown,
    setResendCooldown,
    resendLoading,
    setResendLoading,
  }
}

export function useLoginFormState() {
  const fields = useLoginFormFields()

  function submitStart() {
    fields.setError('')
    fields.setEmailNotVerified(false)
    fields.setLoading(true)
  }

  function submitError(msg: string) {
    fields.setError(msg)
    fields.setLoading(false)
  }

  function decrementResendCooldown() {
    fields.setResendCooldown((c) => c - 1)
  }

  function markEmailNotVerified(emailAddr: string) {
    fields.setEmailNotVerified(true)
    fields.setNotVerifiedEmail(emailAddr)
  }

  return { ...fields, submitStart, submitError, decrementResendCooldown, markEmailNotVerified }
}

export type LoginFormState = ReturnType<typeof useLoginFormState>

export function useResendCooldownEffect(
  resendCooldown: number,
  decrementResendCooldown: () => void
) {
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => decrementResendCooldown(), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown, decrementResendCooldown])
}

export function useStoredRedirect(navigate: ReturnType<typeof useNavigate>) {
  useEffect(() => {
    try {
      const storedRedirect = sessionStorage.getItem('auth_redirect')
      if (storedRedirect) {
        sessionStorage.removeItem('auth_redirect')
        const target = safeRedirect(storedRedirect)
        if (target !== '/dashboard') navigate({ to: target })
      }
    } catch {
      // sessionStorage may be unavailable
    }
  }, [navigate])
}
