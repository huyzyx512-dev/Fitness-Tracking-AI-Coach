import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { billingApi } from '@/api/billing.api'
import { QUERY_KEYS } from '@/lib/constants'
import type { PaymentOrder } from '@/types/billing.types'

const TERMINAL_STATUSES: ReadonlySet<PaymentOrder['status']> = new Set([
  'paid',
  'expired',
  'cancelled',
  'failed',
])

/** Polls the order detail endpoint every 4s until status is terminal. Refetches subscription on paid. */
export function useOrderStatus(orderId: number | string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: orderId ? QUERY_KEYS.BILLING_ORDER(orderId) : ['billing', 'orders', 'noop'],
    queryFn: async () => {
      const { order } = await billingApi.getOrder(orderId!)
      return order
    },
    enabled: Boolean(orderId),
    refetchInterval: (q) => {
      const status = q.state.data?.status
      if (!status) return 4_000
      return TERMINAL_STATUSES.has(status) ? false : 4_000
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  })

  useEffect(() => {
    if (query.data?.status === 'paid') {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BILLING_SUBSCRIPTION })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME })
    }
  }, [query.data?.status, queryClient])

  return query
}
