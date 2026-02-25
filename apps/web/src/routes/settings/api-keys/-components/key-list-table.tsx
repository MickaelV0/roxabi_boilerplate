import { Button, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui'
import type { ApiKey } from '@/lib/apiKeys'
import { m } from '@/paraglide/messages'
import { deriveStatus, formatDate, formatMaskedKey } from '../-helpers'
import { ScopeBadges } from './scope-badges'
import { StatusBadge } from './status-badge'

function KeyListTable({ keys, onRevoke }: { keys: ApiKey[]; onRevoke: (key: ApiKey) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{m.api_keys_col_name()}</TableHead>
          <TableHead>{m.api_keys_col_key()}</TableHead>
          <TableHead className="hidden md:table-cell">{m.api_keys_col_scopes()}</TableHead>
          <TableHead className="hidden sm:table-cell">{m.api_keys_col_created()}</TableHead>
          <TableHead className="hidden lg:table-cell">{m.api_keys_col_last_used()}</TableHead>
          <TableHead>{m.api_keys_col_status()}</TableHead>
          <TableHead className="text-right">{m.api_keys_col_actions()}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => {
          const status = deriveStatus(key)
          return (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.name}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {formatMaskedKey(key)}
                </code>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <ScopeBadges scopes={key.scopes} />
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                {formatDate(key.createdAt)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {formatDate(key.lastUsedAt)}
              </TableCell>
              <TableCell>
                <StatusBadge status={status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRevoke(key)}
                  disabled={status === 'revoked'}
                  className={cn(status === 'revoked' && 'opacity-50 cursor-not-allowed')}
                >
                  {m.api_keys_revoke()}
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export { KeyListTable }
