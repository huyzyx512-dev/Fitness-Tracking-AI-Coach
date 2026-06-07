import { isAxiosError } from 'axios'

const DEFAULT_FALLBACK = 'Đã xảy ra lỗi. Vui lòng thử lại.'
const VALIDATION_FALLBACK = 'Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại.'
const AUTH_FALLBACK =
  'Bạn cần đăng nhập lại hoặc không có quyền thực hiện thao tác này.'
const QUOTA_BUSY = 'AI đang hết hạn mức hoặc quá tải, vui lòng thử lại sau.'
const QUOTA_UNAVAILABLE =
  'AI đang hết hạn mức hoặc tạm thời không khả dụng, vui lòng thử lại sau.'
const PROVIDER_GENERIC = 'AI hiện không thể xử lý yêu cầu. Vui lòng thử lại sau.'
const NETWORK_MSG =
  'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.'
const ADMIN_MSG =
  'AI hiện chưa sẵn sàng. Vui lòng liên hệ quản trị viên hoặc thử lại sau.'

const PROVIDER_QUOTA_HINTS = [
  'quota',
  'rate',
  'giới hạn',
  'hết quota',
  'credit',
  'balance',
  'không khả dụng',
  'provider',
  'ai provider',
]

const TECHNICAL_PATTERNS = [
  /openrouter/i,
  /\bapi\s*key\b/i,
  /\bbearer\b/i,
  /\bauthorization\b/i,
  /request failed with status code \d+/i,
  /^network error$/i,
  /\baxios\b/i,
  /\bat\s+[\w./]+:\d+:\d+/,
  /\{"error"/i,
]

function extractStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const e = error as Record<string, unknown>
  if (typeof e.status === 'number') return e.status
  if (isAxiosError(error)) return error.response?.status
  if (e.response && typeof e.response === 'object') {
    const r = e.response as Record<string, unknown>
    if (typeof r.status === 'number') return r.status
  }
  return undefined
}

function extractBackendMessage(error: unknown): string | undefined {
  if (!error) return undefined
  if (typeof error === 'string') return error.trim() || undefined

  if (typeof error === 'object') {
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string' && e.message.trim()) {
      const msg = e.message.trim()
      if (!isRawAxiosMessage(msg)) return msg
    }
  }

  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const msg = (data as { message?: unknown }).message
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
  }

  return undefined
}

function isRawAxiosMessage(msg: string): boolean {
  return /^Request failed with status code \d+$/.test(msg) || msg === 'Network Error'
}

function getFirstFieldError(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const details = (error as Record<string, unknown>).details
  if (!details || typeof details !== 'object') return undefined

  const d = details as Record<string, unknown>
  const fieldErrors = d.fieldErrors as Record<string, string[]> | undefined
  if (fieldErrors) {
    const firstField = Object.values(fieldErrors).find(
      (msgs) => Array.isArray(msgs) && msgs.length > 0,
    )
    if (firstField) return (firstField as string[])[0]
  }

  const formErrors = d.formErrors as string[] | undefined
  if (Array.isArray(formErrors) && formErrors.length > 0) return formErrors[0]

  return undefined
}

function matchesProviderQuotaHint(message: string): boolean {
  const lower = message.toLowerCase()
  return PROVIDER_QUOTA_HINTS.some((hint) => lower.includes(hint))
}

function mentionsApiKeyOrProviderSecret(message: string): boolean {
  return /\bapi\s*key\b/i.test(message) || /chưa được cấu hình api key/i.test(message)
}

function isTechnicalMessage(message: string): boolean {
  if (message.length > 280) return true
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message))
}

function mapProviderBackendMessage(message: string): string {
  if (mentionsApiKeyOrProviderSecret(message)) return ADMIN_MSG
  if (matchesProviderQuotaHint(message)) return QUOTA_UNAVAILABLE
  if (/ai\s*provider/i.test(message)) return PROVIDER_GENERIC
  return message
}

function isNetworkError(error: unknown, status: number | undefined, backendMessage?: string): boolean {
  if (isAxiosError(error) && !error.response) return true
  if (status != null) return false
  if (backendMessage && /^network error$/i.test(backendMessage)) return true
  if (error && typeof error === 'object') {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string' && /^network error$/i.test(msg)) return true
  }
  return false
}

/**
 * Chuẩn hóa lỗi AI Coach / generate plan cho end-user (status + message backend).
 */
export function getAiFriendlyErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!error) return fallback
  if (typeof error === 'string') {
    return isTechnicalMessage(error) ? fallback : error
  }

  const status = extractStatus(error)
  const backendMessage = extractBackendMessage(error)

  if (isNetworkError(error, status, backendMessage)) {
    return NETWORK_MSG
  }

  if (status === 400) {
    const fieldError = getFirstFieldError(error)
    if (fieldError) return fieldError
    if (backendMessage && !isTechnicalMessage(backendMessage)) return backendMessage
    return VALIDATION_FALLBACK
  }

  if (status === 401 || status === 403) {
    if (backendMessage && mentionsApiKeyOrProviderSecret(backendMessage)) return ADMIN_MSG
    if (backendMessage && !isTechnicalMessage(backendMessage) && !/ai\s*provider/i.test(backendMessage)) {
      return backendMessage
    }
    return AUTH_FALLBACK
  }

  if (status === 429) return QUOTA_BUSY

  if (status === 503) return QUOTA_UNAVAILABLE

  if (status === 502) {
    if (backendMessage && matchesProviderQuotaHint(backendMessage)) return QUOTA_UNAVAILABLE
    if (backendMessage) return mapProviderBackendMessage(backendMessage)
    return PROVIDER_GENERIC
  }

  if (backendMessage) {
    if (mentionsApiKeyOrProviderSecret(backendMessage)) return ADMIN_MSG
    if (matchesProviderQuotaHint(backendMessage)) return QUOTA_UNAVAILABLE
    if (/ai\s*provider/i.test(backendMessage)) return mapProviderBackendMessage(backendMessage)
    if (isTechnicalMessage(backendMessage)) return fallback
    return backendMessage
  }

  return fallback
}
