import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { WorkoutExercise } from '@/types/workout.types'
import type { WorkoutLog } from '@/types/workout-log.types'

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

/** Backend workout completion formula: (minutes × MET × 3.5 × weightKg) / 200 */
export function estimateCaloriesBurnedMet(durationMinutes: number, met: number, weightKg: number): number {
  if (durationMinutes <= 0 || met <= 0 || weightKg <= 0) return 0
  return Math.round((durationMinutes * (met * 3.5 * weightKg)) / 200)
}

/** Rough active-block duration from sets / reps / rest (minutes, min 1 when sets > 0). */
export function estimateExerciseBlockMinutes(sets: number, reps: number, restSeconds: number): number {
  const s = Math.max(0, Math.floor(sets))
  const r = Math.max(0, Math.floor(reps))
  const rest = Math.max(0, Math.floor(restSeconds))
  if (s <= 0) return 0
  const secondsPerSet = Math.min(180, Math.max(15, 20 + r * 2.5))
  const workSeconds = s * secondsPerSet
  const restBetween = Math.max(0, s - 1) * rest
  return Math.max(1, Math.ceil((workSeconds + restBetween) / 60))
}

/** Split `total` into integers proportional to weights (largest remainder); equal split if weights sum to 0. */
export function proportionalIntSplit(total: number, weights: number[]): number[] {
  const n = weights.length
  if (n === 0) return []
  const safe = weights.map((w) => Math.max(0, w))
  const sum = safe.reduce((a, w) => a + w, 0)
  if (total <= 0) return Array(n).fill(0)
  if (sum <= 0) {
    const base = Math.floor(total / n)
    const out = Array(n).fill(base)
    out[0] += total - base * n
    return out
  }

  const exact = safe.map((w) => (total * w) / sum)
  const base = exact.map((x) => Math.floor(x))
  let remainder = total - base.reduce((a, b) => a + b, 0)
  const order = exact.map((x, i) => ({ i, f: x - base[i] })).sort((a, b) => b.f - a.f)
  const result = [...base]
  for (let k = 0; k < remainder; k++) {
    result[order[k].i] += 1
  }
  return result
}

/** Row-level duration/calories vs totals; totals from log when completed, else MET estimate. */
export function computeWorkoutExerciseEnergyRows(
  exercises: WorkoutExercise[],
  log: WorkoutLog | null,
  weightKg: number,
): {
  rowDurationMinutes: number[]
  rowCalories: number[]
  totalDurationMinutes: number
  totalCalories: number
  isActualTotals: boolean
} {
  if (exercises.length === 0) {
    return {
      rowDurationMinutes: [],
      rowCalories: [],
      totalDurationMinutes: log?.duration_minutes ?? 0,
      totalCalories: log?.calories_burned ?? 0,
      isActualTotals: !!log,
    }
  }

  const weights = exercises.map((we) =>
    estimateExerciseBlockMinutes(we.sets, we.reps, we.rest_time_seconds),
  )
  const sumW = weights.reduce((a, b) => a + b, 0)

  let totalMet = 0
  let nMet = 0
  for (const we of exercises) {
    const m = Number(we.exercise?.met_value)
    if (Number.isFinite(m) && m > 0) {
      totalMet += m
      nMet += 1
    }
  }
  const avgMet = nMet > 0 ? totalMet / nMet : 5

  const isActualTotals = !!log
  let totalDurationMinutes: number
  let totalCalories: number

  if (log) {
    totalDurationMinutes = log.duration_minutes
    totalCalories = log.calories_burned
  } else {
    totalDurationMinutes = sumW
    totalCalories = estimateCaloriesBurnedMet(sumW, avgMet, weightKg)
  }

  const rowDurationMinutes = log
    ? proportionalIntSplit(totalDurationMinutes, weights)
    : weights.map((w) => Math.max(0, Math.round(w)))

  const rowCalories = proportionalIntSplit(totalCalories, weights)

  return {
    rowDurationMinutes,
    rowCalories,
    totalDurationMinutes,
    totalCalories,
    isActualTotals,
  }
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
