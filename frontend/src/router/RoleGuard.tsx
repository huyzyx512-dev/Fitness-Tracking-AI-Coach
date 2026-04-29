import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/lib/constants'

interface RoleGuardProps {
  roles: string[]
}

function RoleGuard({ roles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)

  if (!user || !roles.includes(user.role?.name ?? '')) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />
  }

  return <Outlet />
}

export { RoleGuard }
