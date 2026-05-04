import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      role,
      adminPassword,
    }: {
      id: number
      role: 'ADMIN' | 'USER' | 'COACH'
      adminPassword: string
    }) => userApi.updateAdminUserRole(id, role, adminPassword),
    onSuccess: ({ message }, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS() })
      queryClient.invalidateQueries({ queryKey: ['admin-user-audit', variables.id] })
      toast.success(message || 'Đã cập nhật vai trò')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
