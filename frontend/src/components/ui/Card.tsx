import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

function Card({ hover = false, padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card border border-border',
        'transition-all duration-200',
        hover && 'hover:-translate-y-0.5 hover:border-border-hover cursor-pointer',
        paddingMap[padding],
        className,
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 mb-4 border-b border-border', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-foreground', className)} {...props}>
      {children}
    </h3>
  )
}

function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end pt-4 mt-4 border-t border-border gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardBody, CardFooter }
