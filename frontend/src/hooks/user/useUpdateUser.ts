import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/api/user.api'
import { useAuthStore } from '@/store/auth.store'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { UpdateUserPayload } from '@/types/auth.types'

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => userApi.updateMe(payload),
    onSuccess: ({ user }) => {
      setUser(user)
      queryClient.setQueryData(QUERY_KEYS.ME, user)
      toast.success('Cập nhật hồ sơ thành công')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
