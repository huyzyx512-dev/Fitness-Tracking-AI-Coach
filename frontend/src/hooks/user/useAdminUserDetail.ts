import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useAdminUserDetail(userId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_USER(userId as number),
    queryFn: () => userApi.getAdminUserById(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 30_000,
  })
}
