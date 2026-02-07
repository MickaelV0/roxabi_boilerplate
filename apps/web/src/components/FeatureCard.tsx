import { Card, CardContent, CardHeader, CardTitle, cn } from '@repo/ui'
import type * as React from 'react'

function FeatureCard({
  icon,
  title,
  description,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  icon: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        'border-border bg-background transition-all duration-200 hover:-translate-y-1 hover:shadow-md',
        className
      )}
      {...props}
    >
      <CardHeader>
        {icon}
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
export { FeatureCard }
