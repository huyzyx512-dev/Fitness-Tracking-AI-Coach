import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { registerNavigate } from '@/lib/navigation'
import { AdminSidebar } from './AdminSidebar'
import { Breadcrumb } from './Breadcrumb'
import { UserMenu } from './UserMenu'

function AdminLayout() {
  const navigate = useNavigate()
  const [adminNavOpen, setAdminNavOpen] = useState(false)

  useEffect(() => {
    registerNavigate(navigate)
  }, [navigate])

  return (
    <div className={cn('flex h-screen bg-canvas overflow-hidden')}>
      <AdminSidebar open={adminNavOpen} onClose={() => setAdminNavOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 lg:pl-64">
        <header
          className={cn(
            'sticky top-0 z-[80] h-14 flex items-center justify-between gap-4',
            'px-4 lg:px-6 border-b border-border bg-surface/90 backdrop-blur-md',
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setAdminNavOpen((o) => !o)}
              className={cn(
                'lg:hidden flex items-center justify-center h-9 w-9 rounded-xl',
                'text-muted hover:text-foreground hover:bg-card-raised transition-colors',
              )}
              aria-label="Mở menu quản trị"
            >
              <Menu size={18} />
            </button>

            <Breadcrumb />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <UserMenu />
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { AdminLayout }
