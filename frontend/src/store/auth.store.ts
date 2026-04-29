import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/auth.types'
import { setAccessToken, registerLogoutCallback } from '@/api/tokenService'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  setAuth: (token: string, user: User) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      /* ── State ────────────────────────────────────────── */
      user:            null,
      accessToken:     null,
      isAuthenticated: false,

      /* ── Actions ──────────────────────────────────────── */
      setAuth: (token, user) => {
        setAccessToken(token)
        set({ accessToken: token, user, isAuthenticated: true })
      },

      setAccessToken: (token) => {
        setAccessToken(token)
        set({ accessToken: token, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        setAccessToken(null)
        set({ accessToken: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name:    'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive user data; token is also kept for UX
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-sync token service after page reload
        if (state?.accessToken) {
          setAccessToken(state.accessToken)
        }
      },
    },
  ),
)

// Wire logout callback so axios interceptor can trigger it
registerLogoutCallback(() => useAuthStore.getState().logout())
