import { createFileRoute, redirect } from '@tanstack/react-router'
import { DEFAULT_LOCALE, detectLanguage } from '@/lib/i18n'

export const Route = createFileRoute('/')({
  beforeLoad: ({ cause }) => {
    // Skip redirect during preload to avoid infinite pending
    if (cause === 'preload') return

    const cookieHeader = typeof document !== 'undefined' ? document.cookie : null
    const detected = detectLanguage('/', cookieHeader, null)
    const locale = detected.locale || DEFAULT_LOCALE

    throw redirect({
      to: '/$locale',
      params: { locale },
      replace: true,
    })
  },
  component: () => null,
})
