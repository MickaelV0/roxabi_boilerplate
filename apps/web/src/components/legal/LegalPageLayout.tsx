import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type LegalPageLayoutProps = {
  title: string
  children: ReactNode
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>
      <h1 className="mb-8 text-3xl font-bold">{title}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none">{children}</div>
    </div>
  )
}
