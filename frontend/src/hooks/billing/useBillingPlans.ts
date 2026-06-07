import { useQuery } from '@tanstack/react-query'
import { billingApi } from '@/api/billing.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useBillingPlans() {
  return useQuery({
    queryKey: QUERY_KEYS.BILLING_PLANS,
    queryFn: async () => {
      const { plans } = await billingApi.getPlans()
      return plans
    },
    staleTime: 5 * 60_000,
  })
}
