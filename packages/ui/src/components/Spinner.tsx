import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin rounded-full border-current border-r-transparent', {
  variants: {
    size: {
      sm: 'size-4 border-2',
      default: 'size-6 border-2',
      lg: 'size-8 border-[3px]',
      xl: 'size-12 border-4',
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
