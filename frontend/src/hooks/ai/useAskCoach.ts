import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { aiApi } from '@/api/ai.api'
import { getErrorMessage } from '@/lib/utils'

export function useAskCoach() {
  return useMutation({
    mutationFn: aiApi.askCoach,
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
