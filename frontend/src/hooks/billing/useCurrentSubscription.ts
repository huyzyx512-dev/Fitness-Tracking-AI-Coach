import { useQuery } from '@tanstack/react-query'
import { billingApi } from '@/api/billing.api'
import { useAuthStore } from '@/store/auth.store'
import { QUERY_KEYS } from '@/lib/constants'

export function useCurrentSubscription() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: QUERY_KEYS.BILLING_SUBSCRIPTION,
    queryFn: async () => {
      const { subscription } = await billingApi.getCurrentSubscription()
      return subscription
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}
