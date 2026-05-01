/**
 * Imperative navigation utility — allows axios interceptors
 * (outside React tree) to trigger route changes.
 * Wire up in RouterProvider via useNavigate() effect.
 */

type NavigateOptions = {
  replace?: boolean
  state?: unknown
}

type NavigateFn = (path: string, options?: NavigateOptions) => void

let _navigate: NavigateFn | null = null

export function registerNavigate(fn: NavigateFn): void {
  _navigate = fn
}

export function imperativeNavigate(path: string, options?: NavigateOptions): void {
  if (_navigate) {
    _navigate(path, options)
  } else {
    if (options?.replace) {
      window.location.replace(path)
    } else {
      window.location.href = path
    }
  }
}
