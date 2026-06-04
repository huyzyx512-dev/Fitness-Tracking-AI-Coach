import { LogOut, User, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/hooks/auth/useLogout'
import { ROUTES } from '@/lib/constants'

function UserMenu() {
  const user     = useAuthStore((s) => s.user)
  const logout   = useLogout()
  const navigate = useNavigate()

  const items = [
    {
      label:   'Hồ sơ',
      icon:    <User size={14} />,
      onClick: () => navigate(ROUTES.PROFILE),
    },
    {
      label:   'Cài đặt',
      icon:    <Settings size={14} />,
      onClick: () => navigate(ROUTES.PROFILE),
    },
    {
      label:   'Đăng xuất',
      icon:    <LogOut size={14} />,
      onClick: () => logout.mutate(),
      danger:  true,
      divider: true,
    },
  ]

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-card-raised transition-colors"
          aria-label="Menu người dùng"
        >
          <Avatar name={user?.name ?? user?.email} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-foreground leading-none truncate max-w-[120px]">
              {user?.name ?? 'Người dùng'}
            </p>
            <p className="text-xs text-muted mt-0.5 truncate max-w-[120px]">
              {user?.role?.name ?? 'USER'}
            </p>
          </div>
        </button>
      }
      items={items}
      align="right"
    />
  )
}

export { UserMenu }
