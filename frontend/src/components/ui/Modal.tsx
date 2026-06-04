import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizeClasses: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-full mx-4',
}

interface ModalProps {
  open:         boolean
  onClose:      () => void
  title?:       string
  description?: string
  size?:        ModalSize
  children:     ReactNode
  footer?:      ReactNode
  className?:   string
  hideClose?:   boolean
}

function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  className,
  hideClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  /* Lock body scroll */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* Focus trap — move focus into modal on open */
  useEffect(() => {
    if (open) {
      const el = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      el?.focus()
    }
  }, [open])

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative z-10 w-full rounded-2xl bg-card border border-border',
          'animate-fade-up',
          sizeClasses[size],
          className,
        )}
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-muted mt-1">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'ml-4 -mr-1 flex h-8 w-8 items-center justify-center rounded-lg',
                  'text-muted hover:text-foreground hover:bg-card-raised',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                )}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6 border-t border-border mt-2 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export { Modal }
export type { ModalProps, ModalSize }
