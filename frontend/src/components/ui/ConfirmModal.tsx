import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmModalProps {
  open:          boolean
  onClose:       () => void
  onConfirm:     () => void
  title?:        string
  description?:  string
  /** Extra controls (e.g. re-auth password) shown below the description */
  extra?:        ReactNode
  confirmLabel?: string
  cancelLabel?:  string
  variant?:      'danger' | 'warning'
  isLoading?:    boolean
  confirmDisabled?: boolean
}

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title        = 'Xác nhận',
  description  = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  extra,
  confirmLabel = 'Xác nhận',
  cancelLabel  = 'Hủy',
  variant      = 'danger',
  isLoading    = false,
  confirmDisabled = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'secondary'}
            size="sm"
            onClick={onConfirm}
            loading={isLoading}
            disabled={confirmDisabled || isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={
            variant === 'danger'
              ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger'
              : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning'
          }
        >
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted mt-1">{description}</p>
          {extra != null ? <div className="mt-4">{extra}</div> : null}
        </div>
      </div>
    </Modal>
  )
}

export { ConfirmModal }
