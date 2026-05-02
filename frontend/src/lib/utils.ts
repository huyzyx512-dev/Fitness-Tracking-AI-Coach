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

/* ─── HTTP status → friendly Vietnamese fallback ─── */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu không hợp lệ',
  401: 'Bạn cần đăng nhập để tiếp tục',
  403: 'Bạn không có quyền thực hiện hành động này',
  404: 'Không tìm thấy dữ liệu yêu cầu',
  409: 'Dữ liệu đã tồn tại',
  422: 'Dữ liệu không hợp lệ',
  429: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  500: 'Lỗi máy chủ, vui lòng thử lại sau',
  503: 'Dịch vụ tạm thời không khả dụng',
}

/**
 * Extract the most useful human-readable error message from any thrown value.
 *
 * Priority:
 *  1. error.message (set by axios interceptor from backend JSON { message })
 *  2. First fieldError from backend Zod details.fieldErrors
 *  3. HTTP status fallback (STATUS_MESSAGES)
 *  4. Generic Vietnamese fallback
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Đã xảy ra lỗi không xác định'
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>

    /* 1. Normalised error.message set by our interceptor */
    if (typeof e.message === 'string' && e.message && !isRawAxiosMessage(e.message)) {
      return e.message
    }

    /* 2. Backend Zod details.fieldErrors — pick the first one */
    if (e.details && typeof e.details === 'object') {
      const details = e.details as Record<string, unknown>
      const fieldErrors = details.fieldErrors as Record<string, string[]> | undefined
      if (fieldErrors) {
        const firstField = Object.values(fieldErrors).find(
          (msgs) => Array.isArray(msgs) && msgs.length > 0,
        )
        if (firstField) return (firstField as string[])[0]
      }
      const formErrors = details.formErrors as string[] | undefined
      if (Array.isArray(formErrors) && formErrors.length > 0) return formErrors[0]
    }

    /* 3. Status-based fallback */
    const status = typeof e.status === 'number' ? e.status : undefined
    if (status && STATUS_MESSAGES[status]) {
      /* Still prefer backend message even if it looks raw when status known */
      if (typeof e.message === 'string' && e.message) return e.message
      return STATUS_MESSAGES[status]
    }

    /* 4. Fallback: raw response data */
    if (e.response && typeof e.response === 'object') {
      const r = e.response as Record<string, unknown>
      const s = typeof r.status === 'number' ? r.status : undefined
      if (r.data && typeof r.data === 'object') {
        const d = r.data as Record<string, unknown>
        if (typeof d.message === 'string' && d.message) return d.message
      }
      if (s && STATUS_MESSAGES[s]) return STATUS_MESSAGES[s]
    }
  }

  return 'Đã xảy ra lỗi không xác định'
}

/** Detect the raw Axios-generated message we never want to show users */
function isRawAxiosMessage(msg: string): boolean {
  return /^Request failed with status code \d+$/.test(msg) || msg === 'Network Error'
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Sleep for n milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
