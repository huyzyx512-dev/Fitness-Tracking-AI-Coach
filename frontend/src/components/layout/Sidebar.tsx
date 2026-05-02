import { Dumbbell, LayoutDashboard, Activity, ClipboardList, User, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useUIStore } from '@/store/ui.store'
import { SidebarItem } from './SidebarItem'

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD,  label: 'Tổng quan',    icon: <LayoutDashboard size={18} />, end: true },
  { to: ROUTES.WORKOUTS,   label: 'Buổi tập',     icon: <Dumbbell       size={18} /> },
  { to: ROUTES.EXERCISES,  label: 'Bài tập',      icon: <Activity       size={18} /> },
  { to: ROUTES.LOGS,       label: 'Nhật ký',      icon: <ClipboardList  size={18} /> },
  { to: ROUTES.PROFILE,    label: 'Hồ sơ',        icon: <User           size={18} /> },
]

interface SidebarProps {
  className?: string
}

function Sidebar({ className }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[90] bg-canvas/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-[95] h-full w-64 flex flex-col',
          'bg-surface border-r border-border',
          'transition-transform duration-300 ease-out',
          !sidebarOpen && '-translate-x-full lg:translate-x-0',
          className,
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span
              className="text-2xl font-display text-foreground tracking-normal"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              FITTRACK
            </span>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-foreground hover:bg-card-raised transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Bottom branding */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-subtle text-center">FitTrack v1.0</p>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
