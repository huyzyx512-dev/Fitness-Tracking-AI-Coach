/* ─── Generic API wrappers ──────────────────────────────── */

export interface ApiError {
  message: string
  details?: string | Record<string, unknown>
  status?: number
}

export interface MessageResponse {
  message: string
}
