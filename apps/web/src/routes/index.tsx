import { DEFAULT_LOCALE, detectLanguage } from '@/lib/i18n'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const detected = detectLanguage('/', null, null)
    const locale = detected.locale || DEFAULT_LOCALE

    throw redirect({
      to: '/$locale',
      params: { locale },
      replace: true,
    })
  },
  component: () => null,
})
