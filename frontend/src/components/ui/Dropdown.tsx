import {
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DropdownItem {
  label:     string
  icon?:     ReactNode
  onClick:   () => void
  disabled?: boolean
  danger?:   boolean
  divider?:  boolean
}

interface DropdownProps {
  trigger:  ReactNode
  items:    DropdownItem[]
  align?:   'left' | 'right'
  className?: string
}

function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen]           = useState(false)
  const [pos, setPos]             = useState<CSSProperties>({})
  const triggerRef                = useRef<HTMLDivElement>(null)
  const menuRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  align === 'right' ? undefined : rect.left + window.scrollX,
      right: align === 'right'
        ? window.innerWidth - rect.right - window.scrollX
        : undefined,
    })
  }, [open, align])

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <div ref={triggerRef} onClick={() => setOpen((v) => !v)} className={cn('inline-flex', className)}>
        {trigger}
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(
              'fixed z-[100] min-w-[160px] rounded-xl border border-border bg-card py-1',
              'animate-fade-up',
            )}
            style={{ ...pos, boxShadow: 'var(--shadow-modal)' }}
            role="menu"
          >
            {items.map((item, i) => (
              <div key={i}>
                {item.divider && i > 0 && (
                  <div className="my-1 border-t border-border" />
                )}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick()
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm',
                    'transition-colors duration-100',
                    'focus-visible:outline-none focus-visible:bg-card-raised',
                    'disabled:opacity-40 disabled:pointer-events-none',
                    item.danger
                      ? 'text-danger hover:bg-danger-bg'
                      : 'text-foreground hover:bg-card-raised',
                  )}
                >
                  {item.icon && (
                    <span className="shrink-0 text-muted">{item.icon}</span>
                  )}
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

export { Dropdown }
export type { DropdownItem }
