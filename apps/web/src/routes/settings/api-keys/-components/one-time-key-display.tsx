import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui'
import { CheckIcon, CopyIcon, ShieldAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CreateApiKeyResponse } from '@/lib/api-keys'
import { m } from '@/paraglide/messages'

function OneTimeKeyDisplay({
  open,
  onOpenChange,
  createdKey,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  createdKey: CreateApiKeyResponse | null
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  async function handleCopy() {
    if (!createdKey) return
    try {
      await navigator.clipboard.writeText(createdKey.key)
      setCopied(true)
      toast.success(m.api_keys_copied())
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(m.api_keys_copy_failed())
    }
  }

  if (!createdKey) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{m.api_keys_created_title()}</DialogTitle>
          <DialogDescription>{m.api_keys_created_description()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/50 p-3">
            <code className="block break-all font-mono text-sm">{createdKey.key}</code>
          </div>

          <Button onClick={handleCopy} variant="outline" className="w-full">
            {copied ? (
              <>
                <CheckIcon className="mr-2 size-4" />
                {m.api_keys_copied()}
              </>
            ) : (
              <>
                <CopyIcon className="mr-2 size-4" />
                {m.api_keys_copy()}
              </>
            )}
          </Button>

          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {m.api_keys_one_time_warning()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {m.api_keys_done()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { OneTimeKeyDisplay }
