import type * as React from 'react'

// TODO: install sonner package (`bun add sonner` in packages/ui)
// TODO: import { Toaster as SonnerPrimitive, toast } from 'sonner'

/**
 * Toaster — thin wrapper around Sonner's `<Toaster />` primitive.
 * Render once in the root layout.
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * import { Toaster } from '@repo/ui'
 * <Toaster />
 *
 * // Anywhere
 * import { toast } from 'sonner'
 * toast.success('Account created')
 * ```
 */
function Toaster(props: React.ComponentProps<'div'>) {
  // TODO: implement — replace with SonnerPrimitive
  return <div data-slot="toaster" {...props} />
}

export { Toaster }
