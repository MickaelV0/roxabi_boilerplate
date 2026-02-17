import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

type LegalPageLayoutProps = {
  title: string
  children: ReactNode
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  // TODO: implement — back link, consistent typography
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to="/"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour
      </Link>
      <h1 className="mb-8 text-3xl font-bold">{title}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none">{children}</div>
    </div>
  )
}
