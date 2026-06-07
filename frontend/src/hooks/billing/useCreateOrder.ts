import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { billingApi } from '@/api/billing.api'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { CreateOrderPayload } from '@/types/billing.types'

export function useCreateOrder() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => billingApi.createOrder(payload),
    onSuccess: ({ order }) => {
      toast.success('Đã tạo đơn thanh toán')
      navigate(ROUTES.BILLING_ORDER(order.id))
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
