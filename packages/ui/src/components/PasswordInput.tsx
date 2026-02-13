import { Eye, EyeOff } from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

type PasswordStrength = 0 | 1 | 2 | 3 | 4

type StrengthLabels = {
  weak: string
  fair: string
  good: string
  strong: string
}

type RuleLabels = {
  minLength: string
  uppercase: string
  number: string
  symbol: string
}

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  /** Show strength indicator bar + rules checklist below the input */
  showStrength?: boolean
  /** Override default English strength labels */
  strengthLabels?: StrengthLabels
  /** Override default English rule labels */
  ruleLabels?: RuleLabels
}

const strengthColors: Record<PasswordStrength, string> = {
  0: 'bg-muted',
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
}

const DEFAULT_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
}

const DEFAULT_RULE_LABELS: RuleLabels = {
  minLength: '8+ characters',
  uppercase: 'Uppercase letter',
  number: 'Number',
  symbol: 'Symbol',
}

type PasswordRule = {
  key: keyof RuleLabels
  test: (password: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLength', test: (p) => p.length >= 8 },
  { key: 'uppercase', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', test: (p) => /\d/.test(p) },
  { key: 'symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

/** Calculate password strength (0-4) based on rules met. */
function calculateStrength(password: string): PasswordStrength {
  if (password.length === 0) return 0
  const passed = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  return passed as PasswordStrength
}

/**
 * PasswordInput — input with show/hide toggle and optional strength indicator.
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
function PasswordInput({
  className,
  showStrength = false,
  strengthLabels,
  ruleLabels,
  value,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const password = typeof value === 'string' ? value : ''
  const strength = showStrength ? calculateStrength(password) : 0
  const resolvedStrengthLabels: Record<PasswordStrength, string> = strengthLabels
    ? {
        0: '',
        1: strengthLabels.weak,
        2: strengthLabels.fair,
        3: strengthLabels.good,
        4: strengthLabels.strong,
      }
    : DEFAULT_STRENGTH_LABELS
  const resolvedRuleLabels: RuleLabels = ruleLabels ?? DEFAULT_RULE_LABELS

  return (
    <div data-slot="password-input" className="space-y-2">
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-10 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className
          )}
          value={value}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showStrength && password.length > 0 && (
        <div data-slot="password-strength" data-strength={strength} className="space-y-2">
          <div className="flex gap-1">
            {([1, 2, 3, 4] as const).map((segment) => (
              <div
                key={segment}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  strength >= segment ? strengthColors[strength] : 'bg-muted'
                )}
              />
            ))}
          </div>
          {strength > 0 && (
            <p className="text-xs text-muted-foreground">{resolvedStrengthLabels[strength]}</p>
          )}
          <ul className="space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(password)
              const label = resolvedRuleLabels[rule.key]
              return (
                <li
                  key={rule.key}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )}
                >
                  <span className="inline-block size-1.5 rounded-full" aria-hidden="true">
                    {passed ? '\u2713' : '\u2022'}
                  </span>
                  {label}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export { PasswordInput, calculateStrength, PASSWORD_RULES }
export type { PasswordInputProps, PasswordStrength, RuleLabels, StrengthLabels }
