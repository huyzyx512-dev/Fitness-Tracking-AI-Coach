import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string
  error?:       string
  helperText?:  string
  leftIcon?:    ReactNode
  rightIcon?:   ReactNode
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground/80"
          >
            {label}
            {props.required && (
              <span className="text-danger ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-muted pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-xl bg-surface border text-foreground text-sm',
              'placeholder:text-muted/60',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-danger/60 focus:ring-danger/20 focus:border-danger'
                : 'border-border hover:border-border-hover',
              leftIcon  ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 flex items-center text-muted">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-danger flex items-center gap-1" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export { Input }
export type { InputProps }
