import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
      adminPassword,
    }: {
      id: number
      status: 'active' | 'locked'
      adminPassword: string
    }) => userApi.updateAdminUserStatus(id, status, adminPassword),
    onSuccess: ({ message }, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS() })
      queryClient.invalidateQueries({ queryKey: ['admin-user-audit', variables.id] })
      toast.success(message || 'Đã cập nhật trạng thái tài khoản')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
