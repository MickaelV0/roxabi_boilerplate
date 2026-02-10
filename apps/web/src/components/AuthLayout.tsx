import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'
import type * as React from 'react'

// TODO: import app logo/branding
// TODO: import Paraglide messages for footer links

interface AuthLayoutProps {
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
 *
 * @example
 * ```tsx
 * <AuthLayout title="Sign In" description="Sign in to your account">
 *   <LoginForm />
 * </AuthLayout>
 * ```
 */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  // TODO: implement app logo/branding at top
  // TODO: implement footer links (privacy, terms)
  // TODO: implement responsive design (full-width mobile, centered desktop)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* TODO: add app logo above card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
      {/* TODO: add footer links */}
    </div>
  )
}
