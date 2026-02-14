import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const variants = {
  error: { icon: AlertCircle, className: 'text-destructive' },
  success: { icon: CheckCircle, className: 'text-green-600 dark:text-green-400' },
  warning: { icon: AlertTriangle, className: 'text-amber-600 dark:text-amber-400' },
  info: { icon: Info, className: 'text-blue-600 dark:text-blue-400' },
}

function FormMessage({
  variant = 'error',
  children,
  className,
}: {
  variant?: keyof typeof variants
  children: React.ReactNode
  className?: string
}) {
  const { icon: Icon, className: variantClass } = variants[variant]
  return (
    <div
      role="alert"
      aria-live="polite"
      data-slot="form-message"
      className={cn('flex items-start gap-2 text-sm', variantClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export { FormMessage }
