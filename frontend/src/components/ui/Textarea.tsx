import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string
  error?:      string
  helperText?: string
  containerClassName?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, containerClassName, id, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground/80"
          >
            {label}
            {props.required && (
              <span className="text-danger ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-24 rounded-xl bg-surface border text-foreground text-sm',
            'px-4 py-3 resize-y',
            'placeholder:text-muted/60',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-danger/60 focus:ring-danger/20 focus:border-danger'
              : 'border-border hover:border-border-hover',
            className,
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea'
export { Textarea }
