import { createFileRoute, redirect } from '@tanstack/react-router'
import { DEFAULT_LOCALE, detectLanguage } from '@/lib/i18n'

export const Route = createFileRoute('/')({
  beforeLoad: ({ preload }) => {
    // Skip redirect during preload to avoid infinite pending
    if (preload) return

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
