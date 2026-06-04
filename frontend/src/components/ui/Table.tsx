import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkeletonTableRow } from './Skeleton'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key:              string
  header:           string
  render?:          (row: T, index: number) => ReactNode
  sortable?:        boolean
  className?:       string
  headerClassName?: string
}

interface TableProps<T> {
  columns:      Column<T>[]
  data:         T[]
  keyExtractor: (row: T) => string | number
  isLoading?:   boolean
  skeletonRows?: number
  onSort?:      (key: string, dir: 'asc' | 'desc') => void
  sortKey?:     string
  sortDir?:     'asc' | 'desc'
  emptyTitle?:  string
  emptyDesc?:   string
  emptyIcon?:   ReactNode
  emptyAction?: { label: string; onClick: () => void }
  className?:   string
  rowClassName?: (row: T) => string
  onRowClick?:  (row: T) => void
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading     = false,
  skeletonRows  = 5,
  onSort,
  sortKey,
  sortDir,
  emptyTitle    = 'Không có dữ liệu',
  emptyDesc,
  emptyIcon,
  emptyAction,
  className,
  rowClassName,
  onRowClick,
}: TableProps<T>) {
  function handleSort(col: Column<T>) {
    if (!col.sortable || !onSort) return
    const nextDir = sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc'
    onSort(col.key, nextDir)
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                onClick={() => handleSort(col)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider',
                  col.sortable && 'cursor-pointer select-none hover:text-foreground',
                  col.headerClassName,
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonTableRow key={i} cols={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  description={emptyDesc}
                  action={emptyAction}
                />
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border/60 transition-colors duration-100',
                  onRowClick && 'cursor-pointer hover:bg-card/50',
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-foreground', col.className)}
                  >
                    {col.render
                      ? col.render(row, rowIndex)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function SortIcon({
  active,
  dir,
}: {
  active: boolean
  dir?: 'asc' | 'desc'
}) {
  if (!active) return <ChevronsUpDown size={12} className="text-subtle" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-accent" />
    : <ChevronDown size={12} className="text-accent" />
}

export { Table }
