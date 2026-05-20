import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { aiApi } from '@/api/ai.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useGenerateWorkoutPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: aiApi.generateWorkoutPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AI_RECOMMENDATIONS() })
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
