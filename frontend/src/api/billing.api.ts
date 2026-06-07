import { apiClient } from './axios'
import { API_ENDPOINTS } from '@/lib/constants'
import type {
  BillingOrderResponse,
  BillingPlansResponse,
  BillingSubscriptionResponse,
  CreateOrderPayload,
} from '@/types/billing.types'

export const billingApi = {
  getPlans: async (): Promise<BillingPlansResponse> => {
    const { data } = await apiClient.get<BillingPlansResponse>(API_ENDPOINTS.BILLING_PLANS)
    return data
  },

  getCurrentSubscription: async (): Promise<BillingSubscriptionResponse> => {
    const { data } = await apiClient.get<BillingSubscriptionResponse>(
      API_ENDPOINTS.BILLING_SUBSCRIPTION,
    )
    return data
  },

  createOrder: async (payload: CreateOrderPayload): Promise<BillingOrderResponse> => {
    const { data } = await apiClient.post<BillingOrderResponse>(
      API_ENDPOINTS.BILLING_ORDERS,
      payload,
    )
    return data
  },

  getOrder: async (id: number | string): Promise<BillingOrderResponse> => {
    const { data } = await apiClient.get<BillingOrderResponse>(API_ENDPOINTS.BILLING_ORDER(id))
    return data
  },
}
