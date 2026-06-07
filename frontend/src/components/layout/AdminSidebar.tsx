import { Shield, Users, UserPlus, LayoutDashboard, LayoutTemplate, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { SidebarItem } from './SidebarItem'

const ADMIN_NAV = [
  { to: ROUTES.ADMIN_USERS, label: 'Người dùng', icon: <Users size={18} />, end: false },
  { to: ROUTES.ADMIN_USER_NEW, label: 'Tạo người dùng', icon: <UserPlus size={18} />, end: true },
  { to: ROUTES.ADMIN_ROOT, label: 'Tổng quan quản trị', icon: <LayoutTemplate size={18} />, end: true },
] as const

interface AdminSidebarProps {
  open:    boolean
  onClose: () => void
  className?: string
}

function AdminSidebar({ open, onClose, className }: AdminSidebarProps) {
  const closeOnNavigate = () => {
    onClose()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-canvas/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-[95] h-full w-64 flex flex-col',
          'bg-surface border-r border-border',
          'transition-transform duration-300 ease-out',
          !open && '-translate-x-full lg:translate-x-0',
          className,
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground/90">
              <Shield size={16} className="text-canvas" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">FitTrack</p>
              <p
                className="text-lg font-display text-foreground tracking-tight truncate"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Quản trị
              </p>
            </div>
          </div>

          <button
            type="button"
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-foreground hover:bg-card-raised transition-colors"
            onClick={onClose}
            aria-label="Đóng menu quản trị"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Điều hướng quản trị">
          {ADMIN_NAV.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              end={item.end}
              onClick={closeOnNavigate}
            />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-1">
          <SidebarItem
            to={ROUTES.DASHBOARD}
            icon={<LayoutDashboard size={18} />}
            label="Về ứng dụng"
            end
            onClick={closeOnNavigate}
          />
        </div>

        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-subtle text-center">Quản trị FitTrack</p>
        </div>
      </aside>
    </>
  )
}

export { AdminSidebar }
