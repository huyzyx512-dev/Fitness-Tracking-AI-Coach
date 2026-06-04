import { apiClient } from './axios'
import type {
  WorkoutLogListResponse,
  WorkoutLogResponse,
  CreateWorkoutLogPayload,
} from '@/types/workout-log.types'

export const workoutLogApi = {
  getAll: async (): Promise<WorkoutLogListResponse> => {
    const { data } = await apiClient.get<WorkoutLogListResponse>('/workout-logs')
    return data
  },

  create: async (payload: CreateWorkoutLogPayload): Promise<WorkoutLogResponse> => {
    const { data } = await apiClient.post<WorkoutLogResponse>('/workout-logs', payload)
    return data
  },
}
