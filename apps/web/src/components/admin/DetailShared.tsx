import { Skeleton } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

const BACK_LINK_CLASS =
  'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'

type BackLinkProps = {
  to: string
  label: string
}

function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link to={to} className={BACK_LINK_CLASS}>
      <ArrowLeftIcon className="size-4" />
      {label}
    </Link>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )
}

export { BackLink, DetailSkeleton }
