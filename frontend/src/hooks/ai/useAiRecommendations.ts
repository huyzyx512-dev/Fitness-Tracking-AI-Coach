import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/api/ai.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useAiRecommendations() {
  return useQuery({
    queryKey: QUERY_KEYS.AI_RECOMMENDATIONS(),
    queryFn: async () => {
      const { recommendations } = await aiApi.getRecommendations()
      return recommendations
    },
    staleTime: 30_000,
  })
}
