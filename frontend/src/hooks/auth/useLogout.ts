import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/lib/constants'

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Always clear local state, even if server request fails
      logout()
      queryClient.clear()
      navigate(ROUTES.LOGIN, { replace: true })
      toast.success('Đã đăng xuất')
    },
  })
}
