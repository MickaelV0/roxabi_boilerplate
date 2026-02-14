import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin rounded-full border-current border-r-transparent', {
  variants: {
    size: {
      sm: 'h-4 w-4 border-2',
      default: 'h-6 w-6 border-2',
      lg: 'h-8 w-8 border-[3px]',
      xl: 'h-12 w-12 border-4',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

function Spinner({
  className,
  size,
  ...props
}: React.ComponentProps<'output'> & VariantProps<typeof spinnerVariants>) {
  return (
    <output
      data-slot="spinner"
      aria-label={props['aria-label'] ?? 'Loading'}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
