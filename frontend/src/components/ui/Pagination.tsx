import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page:       number
  total:      number
  limit:      number
  onChange:   (page: number) => void
  className?: string
}

function Pagination({ page, total, limit, onChange, className }: PaginationProps) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end   = Math.min(page * limit, total)

  function getPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4)  return [1, 2, 3, 4, 5, '...', totalPages]
    if (page >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  return (
    <div className={cn('flex items-center justify-between gap-4 text-sm', className)}>
      <span className="text-muted text-xs whitespace-nowrap">
        {start}–{end} / {total} kết quả
      </span>

      <div className="flex items-center gap-1">
        <PageBtn
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Trang trước"
        >
          <ChevronLeft size={15} />
        </PageBtn>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted">…</span>
          ) : (
            <PageBtn
              key={p}
              onClick={() => onChange(p as number)}
              active={p === page}
              aria-label={`Trang ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </PageBtn>
          ),
        )}

        <PageBtn
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Trang sau"
        >
          <ChevronRight size={15} />
        </PageBtn>
      </div>
    </div>
  )
}

interface PageBtnProps {
  children:    React.ReactNode
  onClick:     () => void
  disabled?:   boolean
  active?:     boolean
  'aria-label'?:   string
  'aria-current'?: 'page' | undefined
}

function PageBtn({ children, onClick, disabled, active, ...aria }: PageBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 min-w-8 px-2 rounded-lg text-sm font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        'disabled:opacity-30 disabled:pointer-events-none',
        active
          ? 'bg-accent text-white'
          : 'text-muted hover:bg-card hover:text-foreground',
      )}
      {...aria}
    >
      {children}
    </button>
  )
}

export { Pagination }
