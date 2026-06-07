import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useUpdateAdminUsersBulkRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userIds,
      role,
      adminPassword,
    }: {
      userIds: number[]
      role: 'ADMIN' | 'USER' | 'COACH'
      adminPassword: string
    }) => userApi.updateAdminUsersBulkRole(userIds, role, adminPassword),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS() })
      const total = data.succeeded.length + data.failed.length
      toast.success(`Đã xử lý ${data.succeeded.length}/${total} tài khoản`)
      if (data.failed.length > 0) {
        toast.error(`${data.failed.length} tài khoản không thể cập nhật`)
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
