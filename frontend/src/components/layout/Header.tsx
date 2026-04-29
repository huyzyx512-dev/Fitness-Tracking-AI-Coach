import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'
import { Breadcrumb } from './Breadcrumb'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  className?: string
}

function Header({ className }: HeaderProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <header
      className={cn(
        'sticky top-0 z-[80] h-14 flex items-center justify-between gap-4',
        'px-4 lg:px-6 border-b border-border bg-surface/90 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'lg:hidden flex items-center justify-center h-9 w-9 rounded-xl',
            'text-muted hover:text-foreground hover:bg-card-raised transition-colors',
          )}
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        <Breadcrumb />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <UserMenu />
      </div>
    </header>
  )
}

export { Header }
