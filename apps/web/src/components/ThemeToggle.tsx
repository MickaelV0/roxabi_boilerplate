import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme'
import { m } from '@/paraglide/messages'

export function ThemeToggle() {
  const [theme, setCurrentTheme] = useState<Theme>('system')

  useEffect(() => {
    setCurrentTheme(getStoredTheme())
  }, [])

  function handleSelect(value: Theme) {
    setCurrentTheme(value)
    setTheme(value)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={m.theme_toggle()}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleSelect('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          {m.theme_light()}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect('dark')}
          className={theme === 'dark' ? 'bg-accent' : ''}
        >
          {m.theme_dark()}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect('system')}
          className={theme === 'system' ? 'bg-accent' : ''}
        >
          {m.theme_system()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
