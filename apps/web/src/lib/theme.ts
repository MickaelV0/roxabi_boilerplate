export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'roxabi-theme'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', isDark)
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}
