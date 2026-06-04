import { QueryClient } from '@tanstack/react-query'

function isNetworkError(status: number): boolean {
  return status === 0 || status >= 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          30_000,      // 30s before re-fetch
      gcTime:             5 * 60_000,  // 5min cache
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status
        // Never retry on auth/not-found errors
        if (status === 401 || status === 403 || status === 404) return false
        // Retry network/server errors up to 2 times
        if (status && isNetworkError(status)) return failureCount < 2
        return false
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: false,
    },
  },
})
