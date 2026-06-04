import { apiClient } from './axios'
import type {
  WorkoutListResponse,
  WorkoutResponse,
  CreateWorkoutPayload,
  UpdateWorkoutPayload,
  StartWorkoutResponse,
  CompleteWorkoutResponse,
  AddExercisePayload,
  UpdateExerciseInWorkoutPayload,
} from '@/types/workout.types'

export const workoutApi = {
  getAll: async (): Promise<WorkoutListResponse> => {
    const { data } = await apiClient.get<WorkoutListResponse>('/workouts')
    return data
  },

  create: async (payload: CreateWorkoutPayload): Promise<WorkoutResponse> => {
    const { data } = await apiClient.post<WorkoutResponse>('/workouts', payload)
    return data
  },

  update: async (id: number, payload: UpdateWorkoutPayload): Promise<WorkoutResponse> => {
    const { data } = await apiClient.put<WorkoutResponse>(`/workouts/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/workouts/${id}`)
  },

  start: async (id: number): Promise<StartWorkoutResponse> => {
    const { data } = await apiClient.put<StartWorkoutResponse>(`/workouts/${id}/start`)
    return data
  },

  complete: async (id: number): Promise<CompleteWorkoutResponse> => {
    const { data } = await apiClient.patch<CompleteWorkoutResponse>(
      `/workouts/${id}/complete`,
    )
    return data
  },

  addExercise: async (
    workoutId: number,
    exerciseId: number,
    payload: AddExercisePayload,
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post(
      `/workouts/${workoutId}/exercise/${exerciseId}`,
      payload,
    )
    return data
  },

  updateExercise: async (
    workoutId: number,
    exerciseId: number,
    payload: UpdateExerciseInWorkoutPayload,
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.put(
      `/workouts/${workoutId}/exercise/${exerciseId}`,
      payload,
    )
    return data
  },

  removeExercise: async (
    workoutId: number,
    workoutExerciseId: number,
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(
      `/workouts/${workoutId}/workout-exercise/${workoutExerciseId}`,
    )
    return data
  },
}
