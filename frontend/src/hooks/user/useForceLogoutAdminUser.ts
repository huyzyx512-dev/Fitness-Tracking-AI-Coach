import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useForceLogoutAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, adminPassword }: { id: number; adminPassword: string }) =>
      userApi.forceLogoutAdminUser(id, adminPassword),
    onSuccess: ({ message }, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USER(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USER_AUDIT(variables.id) })
      toast.success(message || 'Đã buộc đăng xuất người dùng')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
