import { useRef, useState, useEffect, type ChangeEvent } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value?:       string
  onChange?:    (value: string) => void
  placeholder?: string
  debounce?:    number
  className?:   string
  autoFocus?:   boolean
}

function SearchInput({
  value: externalValue,
  onChange,
  placeholder = 'Tìm kiếm...',
  debounce = 300,
  className,
  autoFocus,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(externalValue ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (externalValue !== undefined) setLocalValue(externalValue)
  }, [externalValue])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setLocalValue(val)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange?.(val), debounce)
  }

  function handleClear() {
    setLocalValue('')
    onChange?.('')
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        className="absolute left-3 text-muted pointer-events-none shrink-0"
        size={15}
      />
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'h-10 w-full rounded-xl bg-surface border border-border',
          'pl-9 pr-9 text-sm text-foreground placeholder:text-muted/60',
          'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
          'transition-colors duration-150',
          'hover:border-border-hover',
          // hide native search clear button
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 text-muted hover:text-foreground transition-colors"
          aria-label="Xóa tìm kiếm"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
