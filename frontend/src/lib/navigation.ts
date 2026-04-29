/**
 * Imperative navigation utility — allows axios interceptors
 * (outside React tree) to trigger route changes.
 * Wire up in RouterProvider via useNavigate() effect.
 */

type NavigateFn = (path: string) => void

let _navigate: NavigateFn | null = null

export function registerNavigate(fn: NavigateFn): void {
  _navigate = fn
}

export function imperativeNavigate(path: string): void {
  if (_navigate) {
    _navigate(path)
  } else {
    window.location.href = path
  }
}
