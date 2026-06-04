import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string
  error?:       string
  helperText?:  string
  options?:     SelectOption[]
  placeholder?: string
  containerClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder,
      className,
      containerClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-foreground/80"
          >
            {label}
            {props.required && (
              <span className="text-danger ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-11 rounded-xl bg-surface border text-foreground text-sm',
              'pr-9 pl-4 appearance-none cursor-pointer',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-danger/60 focus:ring-danger/20 focus:border-danger'
                : 'border-border hover:border-border-hover',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            size={15}
          />
        </div>

        {error && (
          <p className="text-xs text-danger" role="alert">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
export { Select }
export type { SelectProps, SelectOption }
