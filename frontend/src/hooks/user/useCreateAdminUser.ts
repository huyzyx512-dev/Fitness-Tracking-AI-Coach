import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'
import type { AdminCreateUserPayload } from '@/types/admin-user.types'
import { getErrorMessage } from '@/lib/utils'

export function useCreateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AdminCreateUserPayload) => userApi.createAdminUser(payload),
    onSuccess: ({ message }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS() })
      toast.success(message || 'Đã tạo người dùng')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
