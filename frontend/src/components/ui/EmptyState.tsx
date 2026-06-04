import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  icon?:        ReactNode
  title:        string
  description?: string
  action?:      {
    label:   string
    onClick: () => void
  }
  className?:   string
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card-raised text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

export { EmptyState }
