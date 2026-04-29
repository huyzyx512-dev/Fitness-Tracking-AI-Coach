import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-bg text-success border-success/20',
  warning: 'bg-warning-bg text-warning border-warning/20',
  danger:  'bg-danger-bg  text-danger  border-danger/20',
  info:    'bg-info-bg    text-info    border-info/20',
  neutral: 'bg-card-raised text-muted  border-border',
  accent:  'bg-accent/10  text-accent  border-accent/20',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?:     boolean
}

function Badge({ variant = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'text-xs font-medium rounded-md border',
        'whitespace-nowrap',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', {
            'bg-success': variant === 'success',
            'bg-warning': variant === 'warning',
            'bg-danger':  variant === 'danger',
            'bg-info':    variant === 'info',
            'bg-muted':   variant === 'neutral',
            'bg-accent':  variant === 'accent',
          })}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeVariant }
