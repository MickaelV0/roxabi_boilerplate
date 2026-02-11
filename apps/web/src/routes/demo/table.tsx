import { Button, Card, CardContent, Input } from '@repo/ui'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import { compareItems, rankItem } from '@tanstack/match-sorter-utils'
import { createFileRoute } from '@tanstack/react-router'
import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  Header,
  SortingFn,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  sortingFns,
  useReactTable,
} from '@tanstack/react-table'
import React from 'react'
import type { Person } from '@/data/demo-table-data'
import { makeData } from '@/data/demo-table-data'

export const Route = createFileRoute('/demo/table')({
  component: TableDemo,
})

declare module '@tanstack/react-table' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
// biome-ignore lint/suspicious/noExplicitAny: TanStack Table FilterFn requires <any> for reusable filters
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
// biome-ignore lint/suspicious/noExplicitAny: TanStack Table SortingFn requires <any> for reusable sorters
const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if both rows have ranking information
  const rankA = rowA.columnFiltersMeta[columnId]?.itemRank
  const rankB = rowB.columnFiltersMeta[columnId]?.itemRank
  if (rankA && rankB) {
    dir = compareItems(rankA, rankB)
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

function TableDemo() {
  const rerender = React.useReducer(() => ({}), {})[1]

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  // biome-ignore lint/suspicious/noExplicitAny: TanStack Table ColumnDef uses any for mixed accessor types
  const columns = React.useMemo<ColumnDef<Person, any>[]>(
    () => [
      {
        accessorKey: 'id',
        filterFn: 'equalsString', //note: normal non-fuzzy filter column - exact match required
      },
      {
        accessorKey: 'firstName',
        cell: (info) => info.getValue(),
        filterFn: 'includesStringSensitive', //note: normal non-fuzzy filter column - case sensitive
      },
      {
        accessorFn: (row) => row.lastName,
        id: 'lastName',
        cell: (info) => info.getValue(),
        header: () => <span>Last Name</span>,
        filterFn: 'includesString', //note: normal non-fuzzy filter column - case insensitive
      },
      {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: 'fullName',
        header: 'Full Name',
        cell: (info) => info.getValue(),
        filterFn: 'fuzzy', //using our custom fuzzy filter function
        // filterFn: fuzzyFilter, //or just define with the function
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
      },
    ],
    []
  )

  const [data, setData] = React.useState<Person[]>(() => makeData(5_000))
  const refreshData = () => setData((_old) => makeData(50_000)) //stress test

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter, //define as a filter function that can be used in column definitions
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'fuzzy', //apply fuzzy filter to the global filter (most common use case for fuzzy filter)
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), //client side filtering
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  })

  //apply the fuzzy sort if the fullName column is being filtered
  React.useEffect(() => {
    if (table.getState().columnFilters[0]?.id === 'fullName') {
      if (table.getState().sorting[0]?.id !== 'fullName') {
        table.setSorting([{ id: 'fullName', desc: false }])
      }
    }
  }, [table])

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Table</h1>
          <p className="mt-2 text-muted-foreground">
            TanStack Table with sorting, filtering, and pagination
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div>
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={(value) => setGlobalFilter(String(value))}
                placeholder="Search all columns..."
                aria-label="Search all columns"
              />
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm text-foreground">
                <thead className="bg-muted text-foreground">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <HeaderCell key={header.id} header={header} />
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map((row) => {
                    return (
                      <tr key={row.id} className="transition-colors hover:bg-accent">
                        {row.getVisibleCells().map((cell) => {
                          return (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                {'<<'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {'<'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {'>'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                {'>>'}
              </Button>
              <span className="flex items-center gap-1">
                <div>Page</div>
                <strong>
                  {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </strong>
              </span>
              <span className="flex items-center gap-1">
                | Go to page:
                <Input
                  type="number"
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  onChange={(e) => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0
                    table.setPageIndex(page)
                  }}
                  className="w-16"
                />
              </span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="rounded-md border border-border bg-muted px-2 py-1 outline-none focus:border-transparent focus:ring-2 focus:ring-ring"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 text-muted-foreground">
              {table.getPrePaginationRowModel().rows.length} Rows
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => rerender()}>
                Force Rerender
              </Button>
              <Button type="button" variant="outline" onClick={() => refreshData()}>
                Refresh Data
              </Button>
            </div>
            <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-muted-foreground">
              {JSON.stringify(
                {
                  columnFilters: table.getState().columnFilters,
                  globalFilter: table.getState().globalFilter,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HeaderCell({ header }: { header: Header<Person, unknown> }) {
  const sortDir = header.column.getIsSorted()
  const ariaSortValue = sortDir
    ? sortDir === 'asc'
      ? ('ascending' as const)
      : ('descending' as const)
    : ('none' as const)
  return (
    <th
      colSpan={header.colSpan}
      className="px-4 py-3 text-left"
      aria-sort={header.column.getCanSort() ? ariaSortValue : undefined}
    >
      {header.isPlaceholder ? null : (
        <>
          <div
            {...{
              className: header.column.getCanSort()
                ? 'cursor-pointer select-none hover:text-primary transition-colors'
                : '',
              onClick: header.column.getToggleSortingHandler(),
            }}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {sortDir ? { asc: ' 🔼', desc: ' 🔽' }[sortDir] : null}
          </div>
          {header.column.getCanFilter() ? (
            <div className="mt-2">
              <Filter column={header.column} />
            </div>
          ) : null}
        </>
      )}
    </th>
  )
}

function Filter({ column }: { column: Column<Person, unknown> }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <DebouncedInput
      type="text"
      value={typeof columnFilterValue === 'string' ? columnFilterValue : ''}
      onChange={(value) => column.setFilterValue(value)}
      placeholder={`Search...`}
      aria-label={`Filter ${column.id}`}
    />
  )
}

// A typical debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />
}
