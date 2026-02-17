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
          <DialogTitle>Paramètres des cookies</DialogTitle>
          <DialogDescription>
            Choisissez les cookies que vous souhaitez autoriser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Nécessaires</Label>
              <p className="text-xs text-muted-foreground">
                Cookies essentiels au fonctionnement du site
              </p>
            </div>
            <Switch checked disabled aria-label="Nécessaires" />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="consent-analytics">Analytiques</Label>
              <p className="text-xs text-muted-foreground">
                Nous aident à comprendre comment vous utilisez le site
              </p>
            </div>
            <Switch
              id="consent-analytics"
              checked={analytics}
              onCheckedChange={setAnalytics}
              aria-label="Analytiques"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="consent-marketing">Marketing</Label>
              <p className="text-xs text-muted-foreground">
                Permettent de vous proposer des publicités pertinentes
              </p>
            </div>
            <Switch
              id="consent-marketing"
              checked={marketing}
              onCheckedChange={setMarketing}
              aria-label="Marketing"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Enregistrer les préférences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
