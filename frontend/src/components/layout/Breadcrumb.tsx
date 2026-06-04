import { Link, useMatches } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbHandle {
  breadcrumb: string | ((data: unknown) => string)
}

function Breadcrumb({ className }: { className?: string }) {
  const matches = useMatches()

  const crumbs = matches
    .filter((m) => Boolean((m.handle as BreadcrumbHandle | undefined)?.breadcrumb))
    .map((m) => {
      const handle = m.handle as BreadcrumbHandle
      const label  = typeof handle.breadcrumb === 'function'
        ? handle.breadcrumb(m.data)
        : handle.breadcrumb
      return { label, pathname: m.pathname }
    })

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.pathname} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={13} className="text-subtle" aria-hidden="true" />}
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[180px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.pathname}
                className="text-muted hover:text-foreground transition-colors truncate max-w-[160px]"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export { Breadcrumb }
