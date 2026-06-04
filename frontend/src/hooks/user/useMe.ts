import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/user.api'
import { useAuthStore } from '@/store/auth.store'
import { QUERY_KEYS } from '@/lib/constants'

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: async () => {
      const { user } = await userApi.getMe()
      return user
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  })
}
