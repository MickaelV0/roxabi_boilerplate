import { cn } from '@repo/ui'

function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn('mb-12 text-center', className)}>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
export { SectionHeading }
