import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/user.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useAdminUserAuditLogs(userId: number | undefined, page = 1, limit = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_USER_AUDIT(userId as number, { page, limit }),
    queryFn: () => userApi.getAdminUserAuditLogs(userId as number, { page, limit }),
    enabled: typeof userId === 'number' && userId > 0,
  })
}
