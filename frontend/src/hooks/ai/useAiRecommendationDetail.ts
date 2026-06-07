import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/api/ai.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useAiRecommendationDetail(id?: number | string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.AI_RECOMMENDATION(id ?? 'unknown'),
    queryFn: async () => {
      const { recommendation } = await aiApi.getRecommendationDetail(id!)
      return recommendation
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
