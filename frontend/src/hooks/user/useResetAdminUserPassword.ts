import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useResetAdminUserPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, adminPassword }: { id: number; adminPassword: string }) =>
      userApi.resetAdminUserPassword(id, adminPassword),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS() })
      queryClient.invalidateQueries({ queryKey: ['admin-user-audit', variables.id] })
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
