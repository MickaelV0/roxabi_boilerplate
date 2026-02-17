import type { ConsentCategories } from '@repo/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
} from '@repo/ui'

type ConsentModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ConsentCategories
  onSave: (categories: ConsentCategories) => void
}

export function ConsentModal({ open, onOpenChange, categories, onSave }: ConsentModalProps) {
  // TODO: implement
  // - Modal with category toggles
  // - Necessary: always on, toggle disabled, explanation text
  // - Analytics: toggle (default off), explanation text
  // - Marketing: toggle (default off), explanation text
  // - "Save preferences" button
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paramètres des cookies</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* TODO: implement category toggles with state management */}
          <div className="flex items-center justify-between">
            <Label>Nécessaires</Label>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label>Analytiques</Label>
            <Switch checked={categories.analytics} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Marketing</Label>
            <Switch checked={categories.marketing} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSave(categories)}>Enregistrer les préférences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
