import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?:       string
  description?: string
  error?:       string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, ...props }, ref) => {
    const checkId = id ?? (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkId}
          className={cn(
            'flex items-start gap-3 cursor-pointer group',
            props.disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {/* 
            `chk` class activates the CSS-only custom styling in index.css.
            appearance-none + :checked background-image = reliable cross-browser checkmark.
          */}
          <input
            ref={ref}
            id={checkId}
            type="checkbox"
            className={cn(
              'chk',
              'h-5 w-5 shrink-0 mt-0.5 cursor-pointer',
              'border border-border bg-surface',
              'transition-colors duration-150',
              'group-hover:border-border-hover',
              'focus-visible:outline-none',
              error && 'border-danger',
              className,
            )}
            {...props}
          />

          {(label || description) && (
            <div>
              {label && (
                <span className="text-sm font-medium text-foreground leading-snug">
                  {label}
                </span>
              )}
              {description && (
                <p className="text-xs text-muted mt-0.5">{description}</p>
              )}
            </div>
          )}
        </label>

        {error && (
          <p className="text-xs text-danger ml-8" role="alert">{error}</p>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
export { Checkbox }
