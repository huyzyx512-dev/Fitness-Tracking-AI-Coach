import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { imperativeNavigate } from '@/lib/navigation'
import { ROUTES, API_ENDPOINTS } from '@/lib/constants'
import { getAccessToken, setAccessToken, triggerLogout } from './tokenService'

/* ─── Main API instance ─────────────────────────────────── */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10_000,
  withCredentials: true, // send HttpOnly refresh-token cookie
  headers: { 'Content-Type': 'application/json' },
})

/* ─── Separate refresh client (no interceptors → avoids loops) */
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/* ─── Refresh queue — deduplicate concurrent 401 retries ── */
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!),
  )
  refreshQueue = []
}

/* ─── Request interceptor ───────────────────────────────── */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

/* ─── Response interceptor ──────────────────────────────── */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    /* ── 401: attempt token refresh once ───────────────── */
    /* Skip refresh for auth routes — let their 401 fall through
       to the normalization block so the backend message is shown. */
    const isAuthRoute = original.url
      ? ['/auth/login', '/auth/register', '/auth/logout'].some((p) =>
          original.url!.includes(p),
        )
      : false

    if (status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              if (original.headers) {
                (original.headers as Record<string, string>)['Authorization'] =
                  `Bearer ${token}`
              }
              resolve(apiClient(original))
            },
            reject,
          })
        })
      }

      isRefreshing = true

      try {
        const { data } = await refreshClient.post<{ accessToken: string }>(
          API_ENDPOINTS.REFRESH_TOKEN,
        )
        const newToken = data.accessToken
        setAccessToken(newToken)
        processQueue(null, newToken)
        isRefreshing = false

        if (original.headers) {
          (original.headers as Record<string, string>)['Authorization'] =
            `Bearer ${newToken}`
        }
        return apiClient(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false
        triggerLogout()
        imperativeNavigate(ROUTES.LOGIN, { replace: true })
        /* Reject with a clear message, not the raw Axios string */
        return Promise.reject(
          Object.assign(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'), {
            status: 401,
          }),
        )
      }
    }

    /* ── 403: DO NOT navigate globally ───────────────────
       Background refetches / in-flight requests from other pages can return 403
       and would otherwise force the UI back to /403 repeatedly.
       Let screens decide how to present 403 (toast / ErrorState / RoleGuard). */

    /* ── Normalise error shape ──────────────────────────── */
    const serverMessage =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'Đã xảy ra lỗi'

    const apiError = Object.assign(new Error(serverMessage), {
      status,
      details: (error.response?.data as { details?: unknown })?.details,
    })

    return Promise.reject(apiError)
  },
)
