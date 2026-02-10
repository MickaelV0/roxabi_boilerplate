import type * as React from 'react'
import { Toaster as SonnerPrimitive } from 'sonner'

type ToasterProps = React.ComponentProps<typeof SonnerPrimitive>

/**
 * Toaster — thin wrapper around Sonner's `<Toaster />` with shadcn/ui theming.
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
function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerPrimitive
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export type { ToasterProps }
