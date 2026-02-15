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
import { m } from '@/paraglide/messages'

type NotificationVariant = {
  label: string
  title: string
  description: string
  borderColor: string
  badgeClass: string
  icon: ReactNode
}

function getNotifications(): NotificationVariant[] {
  return [
    {
      label: m.ds_feedback_success(),
      title: m.ds_feedback_success_title(),
      description: m.ds_feedback_success_desc(),
      borderColor: 'border-l-success',
      badgeClass: 'bg-success/10 text-success border-success/20',
      icon: <CheckIcon className="size-4" />,
    },
    {
      label: m.ds_feedback_error(),
      title: m.ds_feedback_error_title(),
      description: m.ds_feedback_error_desc(),
      borderColor: 'border-l-destructive',
      badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: <XIcon className="size-4" />,
    },
    {
      label: m.ds_feedback_warning(),
      title: m.ds_feedback_warning_title(),
      description: m.ds_feedback_warning_desc(),
      borderColor: 'border-l-warning',
      badgeClass: 'bg-warning/10 text-warning border-warning/20',
      icon: <AlertTriangleIcon className="size-4" />,
    },
    {
      label: m.ds_feedback_info(),
      title: m.ds_feedback_info_title(),
      description: m.ds_feedback_info_desc(),
      borderColor: 'border-l-info',
      badgeClass: 'bg-info/10 text-info border-info/20',
      icon: <InfoIcon className="size-4" />,
    },
  ]
}

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
  const notifications = getNotifications()

  return (
    <div className="space-y-10">
      {/* Toast/Alert notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{m.ds_feedback_notifications()}</h3>
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
        <h3 className="text-lg font-semibold">{m.ds_feedback_empty_state()}</h3>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="border-muted-foreground/25 mb-6 flex size-20 items-center justify-center rounded-xl border-2 border-dashed">
              <span className="text-muted-foreground text-3xl">+</span>
            </div>
            <h4 className="text-lg font-semibold">{m.ds_feedback_no_results()}</h4>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm">
              {m.ds_feedback_no_results_desc()}
            </p>
            <Button className="mt-6">{m.ds_feedback_create_first()}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
