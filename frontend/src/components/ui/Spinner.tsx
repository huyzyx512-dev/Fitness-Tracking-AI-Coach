import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<SpinnerSize, number> = { sm: 14, md: 20, lg: 28 }

interface SpinnerProps {
  size?:      SpinnerSize
  className?: string
  label?:     string
}

export function Spinner({ size = 'md', className, label = 'Đang tải...' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center gap-2 text-muted', className)}
    >
      <Loader2
        className="animate-spin text-accent"
        size={sizeMap[size]}
        aria-hidden="true"
      />
    </span>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
