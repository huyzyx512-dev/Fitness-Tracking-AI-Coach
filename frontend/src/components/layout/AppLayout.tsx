import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { registerNavigate } from '@/lib/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

function AppLayout() {
  const navigate = useNavigate()

  /* Wire imperative navigation for axios interceptors */
  useEffect(() => {
    registerNavigate(navigate)
  }, [navigate])

  return (
    <div className={cn('flex h-screen bg-canvas overflow-hidden')}>
      <Sidebar />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-64">
        <Header />

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

export { AppLayout }
