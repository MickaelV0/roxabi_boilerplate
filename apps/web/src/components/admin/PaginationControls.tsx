import { Button } from '@repo/ui'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { m } from '@/paraglide/messages'

type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type PaginationControlsProps = {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t px-2 pt-4">
      <p className="text-sm text-muted-foreground">
        {m.admin_pagination_page_of({
          page: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
        })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeftIcon className="mr-1 size-4" />
          {m.admin_pagination_previous()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          {m.admin_pagination_next()}
          <ChevronRightIcon className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}
