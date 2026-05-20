import { apiClient } from './axios'
import { API_ENDPOINTS } from '@/lib/constants'
import type {
  AiAskRequest,
  AiAskResponse,
  AiWorkoutPlanRequest,
  AiWorkoutPlanResponse,
  AiRecommendationsResponse,
  AiRecommendationDetailResponse,
  AiApplyRecommendationRequest,
  AiApplyRecommendationResponse,
} from '@/types/ai.types'

export const aiApi = {
  askCoach: async (payload: AiAskRequest): Promise<AiAskResponse> => {
    const { data } = await apiClient.post<AiAskResponse>(API_ENDPOINTS.AI_ASK, payload)
    return data
  },

  generateWorkoutPlan: async (
    payload: AiWorkoutPlanRequest,
  ): Promise<AiWorkoutPlanResponse> => {
    const { data } = await apiClient.post<AiWorkoutPlanResponse>(
      API_ENDPOINTS.AI_RECOMMENDATION_GENERATE,
      payload,
    )
    return data
  },

  getRecommendations: async (): Promise<AiRecommendationsResponse> => {
    const { data } = await apiClient.get<AiRecommendationsResponse>(
      API_ENDPOINTS.AI_RECOMMENDATIONS,
    )
    return data
  },

  getRecommendationDetail: async (
    id: number | string,
  ): Promise<AiRecommendationDetailResponse> => {
    const { data } = await apiClient.get<AiRecommendationDetailResponse>(
      API_ENDPOINTS.AI_RECOMMENDATION(id),
    )
    return data
  },

  applyRecommendation: async (
    id: number | string,
    payload: AiApplyRecommendationRequest,
  ): Promise<AiApplyRecommendationResponse> => {
    const { data } = await apiClient.post<AiApplyRecommendationResponse>(
      API_ENDPOINTS.AI_RECOMMENDATION_APPLY(id),
      payload,
    )
    return data
  },
}
