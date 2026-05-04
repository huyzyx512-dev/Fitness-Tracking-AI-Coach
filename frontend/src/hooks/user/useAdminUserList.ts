import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'
import type { AdminUserListParams } from '@/types/admin-user.types'

export function useAdminUserList(params: AdminUserListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_USERS(params),
    queryFn: () => userApi.getAdminUsers(params),
    staleTime: 30_000,
  })
}
