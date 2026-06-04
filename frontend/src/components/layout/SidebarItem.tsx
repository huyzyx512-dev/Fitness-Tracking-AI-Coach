import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  to:       string
  icon:     ReactNode
  label:    string
  end?:     boolean
  onClick?: () => void
}

function SidebarItem({ to, icon, label, end = false, onClick }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          isActive
            ? 'bg-accent/10 text-accent border border-accent/20'
            : 'text-muted hover:bg-card-raised hover:text-foreground border border-transparent',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'shrink-0 transition-colors',
              isActive ? 'text-accent' : 'text-subtle group-hover:text-muted',
            )}
          >
            {icon}
          </span>
          <span className="truncate">{label}</span>
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
          )}
        </>
      )}
    </NavLink>
  )
}

export { SidebarItem }
