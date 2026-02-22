import { Button, Card, CardContent } from '@repo/ui'
import { AlertCircleIcon } from 'lucide-react'
import { m } from '@/paraglide/messages'

type ErrorCardProps = {
  message: string
  onRetry: () => void
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertCircleIcon className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          {m.admin_error_retry()}
        </Button>
      </CardContent>
    </Card>
  )
}
