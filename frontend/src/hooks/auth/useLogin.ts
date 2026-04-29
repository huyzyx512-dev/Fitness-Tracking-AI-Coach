import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth.api'
import { userApi } from '@/api/user.api'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { LoginPayload } from '@/types/auth.types'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { accessToken } = await authApi.login(payload)
      // Fetch full user profile with the new token
      const { user } = await userApi.getMe()
      return { accessToken, user }
    },
    onSuccess: ({ accessToken, user }) => {
      setAuth(accessToken, user)
      toast.success(`Chào mừng, ${user.name || user.email}!`)
      navigate(ROUTES.DASHBOARD, { replace: true })
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
