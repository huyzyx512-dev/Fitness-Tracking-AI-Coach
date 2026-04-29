import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size    = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<Variant, string> = {
  primary:   'bg-accent hover:bg-accent-light text-white shadow-sm',
  secondary: 'bg-card-raised hover:bg-card-raised/70 text-foreground border border-border hover:border-border-hover',
  ghost:     'hover:bg-card text-foreground',
  danger:    'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/25',
  outline:   'border border-border hover:border-border-hover text-foreground hover:bg-card',
}

const sizeClasses: Record<Size, string> = {
  sm:   'h-8  px-3   text-xs  gap-1.5 rounded-lg',
  md:   'h-10 px-4   text-sm  gap-2   rounded-xl',
  lg:   'h-12 px-6   text-base gap-2.5 rounded-xl',
  icon: 'h-9  w-9    text-sm          rounded-xl',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'active:scale-[0.97]',
          'disabled:pointer-events-none disabled:opacity-40',
          'select-none cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 13 : 15} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {size !== 'icon' && children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
export { Button }
export type { ButtonProps, Variant as ButtonVariant, Size as ButtonSize }
