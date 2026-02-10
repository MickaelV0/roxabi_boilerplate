import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

type AuthLayoutProps = {
  /** Page title displayed in the card header */
  title: string
  /** Optional subtitle/description */
  description?: string
  /** Card content */
  children: React.ReactNode
}

/**
 * AuthLayout — centered card layout for all auth pages.
 *
 * Provides consistent branding, responsive design (centered on desktop,
 * full-width on mobile), and optional footer links.
 */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center bg-background p-4">
      <Link
        to="/"
        className="mb-8 text-2xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
      >
        Roxabi
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </div>
  )
}
