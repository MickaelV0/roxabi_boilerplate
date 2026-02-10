import type * as React from 'react'

import { cn } from '@/lib/utils'

// TODO: import Eye, EyeOff icons from lucide-react

type PasswordStrength = 0 | 1 | 2 | 3 | 4

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** Show strength indicator bar + rules checklist */
  showStrength?: boolean
}

/**
 * PasswordInput — input with show/hide toggle and optional strength indicator.
 *
 * Strength rules:
 * - 8+ characters
 * - At least one uppercase letter
 * - At least one number
 * - At least one symbol
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   showStrength
 * />
 * ```
 */
function PasswordInput({ className, showStrength = false, ...props }: PasswordInputProps) {
  // TODO: implement show/hide toggle (Eye/EyeOff icons)
  // TODO: implement strength calculation from value
  // TODO: implement strength bar (4 segments, colored by strength level)
  // TODO: implement rules checklist (8+ chars, uppercase, number, symbol)

  return (
    <div data-slot="password-input" className="space-y-2">
      <div className="relative">
        <input
          type="password"
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-10 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className
          )}
          {...props}
        />
        {/* TODO: toggle button (Eye/EyeOff) positioned absolute right */}
      </div>
      {showStrength && (
        <div data-slot="password-strength">
          {/* TODO: strength bar segments */}
          {/* TODO: rules checklist */}
        </div>
      )}
    </div>
  )
}

/** Calculate password strength (0-4) based on rules met. */
function calculateStrength(_password: string): PasswordStrength {
  // TODO: implement
  return 0
}

export { PasswordInput, calculateStrength }
export type { PasswordInputProps, PasswordStrength }
