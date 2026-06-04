import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth.api'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { RegisterPayload } from '@/types/auth.types'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate(ROUTES.LOGIN, { replace: true })
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
