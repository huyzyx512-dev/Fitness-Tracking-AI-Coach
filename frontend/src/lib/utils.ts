import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format date to dd/MM/yyyy */
export function formatDate(
  date: string | Date | null | undefined,
  pattern = 'dd/MM/yyyy',
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return format(d, pattern, { locale: vi })
}

/** Format datetime to dd/MM/yyyy HH:mm */
export function formatDatetime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/** Relative time: "3 giờ trước" */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: vi })
}

/** Format duration in minutes to "1h 30p" */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes}p`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}p` : `${h}h`
}

/** Truncate string with ellipsis */
export function truncate(str: string | null | undefined, length = 60): string {
  if (!str) return ''
  return str.length > length ? `${str.slice(0, length)}…` : str
}

/** Format number with locale */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN').format(n)
}

/** Format calories */
export function formatCalories(kcal: number | null | undefined): string {
  if (kcal == null) return '—'
  return `${formatNumber(kcal)} kcal`
}

/** Get initials from full name */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Extract error message from API error or unknown */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Đã xảy ra lỗi không xác định'
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string') return e.message
    if (e.response && typeof e.response === 'object') {
      const r = e.response as Record<string, unknown>
      if (r.data && typeof r.data === 'object') {
        const d = r.data as Record<string, unknown>
        if (typeof d.message === 'string') return d.message
      }
    }
  }
  return 'Đã xảy ra lỗi không xác định'
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Sleep for n milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
