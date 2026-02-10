import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// TODO: add provider SVG icons (Google, GitHub)

const oAuthButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border bg-background text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-9 px-4 py-2',
        lg: 'h-10 px-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

type OAuthProvider = 'google' | 'github'

interface OAuthButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof oAuthButtonVariants> {
  /** OAuth provider — determines icon and default label */
  provider: OAuthProvider
  /** Show loading spinner */
  loading?: boolean
}

/**
 * OAuthButton — branded button for OAuth sign-in.
 *
 * @example
 * ```tsx
 * <OAuthButton provider="google" onClick={() => authClient.signIn.social({ provider: 'google' })}>
 *   Sign in with Google
 * </OAuthButton>
 * ```
 */
function OAuthButton({
  className,
  provider,
  size,
  loading = false,
  children,
  disabled,
  ...props
}: OAuthButtonProps) {
  // TODO: implement provider icon rendering
  // TODO: implement loading spinner state
  const label = children ?? `Sign in with ${provider === 'google' ? 'Google' : 'GitHub'}`

  return (
    <button
      type="button"
      data-slot="oauth-button"
      data-provider={provider}
      className={cn(oAuthButtonVariants({ size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {/* TODO: render provider SVG icon */}
      {loading ? 'Loading...' : label}
    </button>
  )
}

export { OAuthButton, oAuthButtonVariants }
export type { OAuthButtonProps, OAuthProvider }
