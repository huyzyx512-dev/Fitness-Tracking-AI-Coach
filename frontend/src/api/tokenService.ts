/**
 * Minimal in-memory token store — no React/Zustand dependencies.
 * Used by axios interceptors to avoid circular imports.
 * The Zustand auth store calls setAccessToken() to keep this in sync.
 */

let _accessToken: string | null = null
let _logoutCallback: (() => void) | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function registerLogoutCallback(fn: () => void): void {
  _logoutCallback = fn
}

export function triggerLogout(): void {
  _logoutCallback?.()
}
