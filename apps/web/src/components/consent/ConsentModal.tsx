import type { ConsentCategories } from '@repo/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Separator,
  Switch,
} from '@repo/ui'
import { useEffect, useState } from 'react'
import { m } from '@/paraglide/messages'

type ConsentModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ConsentCategories
  onSave: (categories: ConsentCategories) => void
}

export function ConsentModal({ open, onOpenChange, categories, onSave }: ConsentModalProps) {
  const [analytics, setAnalytics] = useState(categories.analytics)
  const [marketing, setMarketing] = useState(categories.marketing)

  // Sync local state when props change (e.g., after DB reconciliation)
  useEffect(() => {
    setAnalytics(categories.analytics)
    setMarketing(categories.marketing)
  }, [categories.analytics, categories.marketing])

  function handleSave() {
    onSave({ necessary: true, analytics, marketing })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.consent_modal_title()}</DialogTitle>
          <DialogDescription>{m.consent_modal_description()}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>{m.consent_necessary_label()}</Label>
              <p className="text-xs text-muted-foreground">{m.consent_necessary_description()}</p>
            </div>
            <Switch checked disabled aria-label={m.consent_necessary_label()} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="consent-analytics">{m.consent_analytics_label()}</Label>
              <p className="text-xs text-muted-foreground">{m.consent_analytics_description()}</p>
            </div>
            <Switch
              id="consent-analytics"
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label={m.consent_analytics_label()}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="consent-marketing">{m.consent_marketing_label()}</Label>
              <p className="text-xs text-muted-foreground">{m.consent_marketing_description()}</p>
            </div>
            <Switch
              id="consent-marketing"
              checked={marketing}
              onCheckedChange={setMarketing}
              aria-label={m.consent_marketing_label()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{m.consent_save_preferences()}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
