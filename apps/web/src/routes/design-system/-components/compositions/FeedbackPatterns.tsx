import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@repo/ui'
import { AlertTriangleIcon, CheckIcon, InfoIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type NotificationVariant = {
  label: string
  title: string
  description: string
  borderColor: string
  badgeClass: string
  icon: ReactNode
}

const notifications: NotificationVariant[] = [
  {
    label: 'Success',
    title: 'Operation completed',
    description: 'Your changes have been saved successfully.',
    borderColor: 'border-l-green-500',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckIcon className="size-4" />,
  },
  {
    label: 'Error',
    title: 'Something went wrong',
    description: 'There was an error processing your request. Please try again.',
    borderColor: 'border-l-red-500',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    icon: <XIcon className="size-4" />,
  },
  {
    label: 'Warning',
    title: 'Attention required',
    description: 'Your account storage is almost full. Consider upgrading your plan.',
    borderColor: 'border-l-yellow-500',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertTriangleIcon className="size-4" />,
  },
  {
    label: 'Info',
    title: 'New update available',
    description: 'A new version is available. Refresh the page to get the latest features.',
    borderColor: 'border-l-blue-500',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <InfoIcon className="size-4" />,
  },
]

/**
 * Feedback composition patterns.
 *
 * Renders two patterns:
 * 1. Toast/alert notifications -- success, error, warning, info variants
 * 2. Empty state -- icon placeholder, heading, description, action button
 *
 * Uses real @repo/ui components with realistic (but static) data.
 */
export function FeedbackPatterns() {
  return (
    <div className="space-y-10">
      {/* Toast/Alert notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {notifications.map((notification) => (
            <Card key={notification.label} className={cn('border-l-4', notification.borderColor)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      notification.badgeClass
                    )}
                  >
                    {notification.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{notification.title}</CardTitle>
                      <Badge variant="outline" className={notification.badgeClass}>
                        {notification.label}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">{notification.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty state */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Empty State</h3>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="border-muted-foreground/25 mb-6 flex size-20 items-center justify-center rounded-xl border-2 border-dashed">
              <span className="text-muted-foreground text-3xl">+</span>
            </div>
            <h4 className="text-lg font-semibold">No results found</h4>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm">
              It looks like there are no items yet. Get started by creating your first one.
            </p>
            <Button className="mt-6">Create your first item</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
