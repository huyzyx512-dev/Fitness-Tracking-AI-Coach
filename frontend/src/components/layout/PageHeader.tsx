import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title:        string
  description?: string
  action?:      ReactNode
  className?:   string
}

function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h1
          className="text-3xl text-foreground"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export { PageHeader }
