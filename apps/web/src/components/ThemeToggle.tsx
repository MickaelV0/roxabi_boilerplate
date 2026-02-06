import { Button } from '@repo/ui'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStoredTheme, setTheme } from '@/lib/theme'
import { m } from '@/paraglide/messages'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = getStoredTheme()
    const dark =
      stored === 'dark' ||
      (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
  }, [])

  function toggle() {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    setTheme(next)
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={m.theme_toggle()}>
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  )
}
