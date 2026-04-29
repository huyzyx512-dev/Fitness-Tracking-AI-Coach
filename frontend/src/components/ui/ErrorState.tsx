import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { getErrorMessage } from '@/lib/utils'

interface ErrorStateProps {
  error?:     unknown
  message?:   string
  onRetry?:   () => void
  className?: string
}

function ErrorState({ error, message, onRetry, className }: ErrorStateProps) {
  const msg = message ?? getErrorMessage(error) ?? 'Đã xảy ra lỗi'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-bg text-danger">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">Không thể tải dữ liệu</h3>
      <p className="text-sm text-muted max-w-sm">{msg}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      )}
    </div>
  )
}

export { ErrorState }
