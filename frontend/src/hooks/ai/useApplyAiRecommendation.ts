import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { aiApi } from '@/api/ai.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { AiApplyRecommendationRequest } from '@/types/ai.types'

type ApplyAiRecommendationVariables = {
  id: number | string
  payload: AiApplyRecommendationRequest
}

export function useApplyAiRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: ApplyAiRecommendationVariables) =>
      aiApi.applyRecommendation(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AI_RECOMMENDATIONS() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AI_RECOMMENDATION(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success(data.message || 'Áp dụng kế hoạch AI thành công')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
