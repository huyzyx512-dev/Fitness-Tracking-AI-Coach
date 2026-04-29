import { type HTMLAttributes } from 'react'
import { cn, getInitials } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<AvatarSize, { container: string; text: string; img: string }> = {
  xs: { container: 'h-6 w-6',   text: 'text-xs',   img: 'h-6 w-6' },
  sm: { container: 'h-8 w-8',   text: 'text-xs',   img: 'h-8 w-8' },
  md: { container: 'h-10 w-10', text: 'text-sm',   img: 'h-10 w-10' },
  lg: { container: 'h-12 w-12', text: 'text-base', img: 'h-12 w-12' },
  xl: { container: 'h-16 w-16', text: 'text-xl',   img: 'h-16 w-16' },
}

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?:  string
  src?:   string
  size?:  AvatarSize
  alt?:   string
}

function Avatar({ name, src, size = 'md', alt, className, ...props }: AvatarProps) {
  const s = sizeMap[size]

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden',
        'bg-accent/20 flex items-center justify-center',
        'ring-2 ring-border',
        s.container,
        className,
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name ?? 'Avatar'}
          className={cn('object-cover', s.img)}
          loading="lazy"
        />
      ) : (
        <span
          className={cn('font-semibold text-accent select-none', s.text)}
          aria-hidden="true"
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}

export { Avatar }
