import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { aiApi } from '@/api/ai.api'
import { getAiFriendlyErrorMessage } from '@/lib/aiError'

export function useAskCoach() {
  return useMutation({
    mutationFn: aiApi.askCoach,
    onError: (error: unknown) => {
      toast.error(getAiFriendlyErrorMessage(error))
    },
  })
}
