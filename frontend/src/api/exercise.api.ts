import { apiClient, apiUploadClient } from './axios'
import type {
  ExerciseListResponse,
  ExerciseResponse,
  CreateExercisePayload,
  UpdateExercisePayload,
} from '@/types/exercise.types'

export const exerciseApi = {
  getAll: async (): Promise<ExerciseListResponse> => {
    const { data } = await apiClient.get<ExerciseListResponse>('/exercises')
    return data
  },

  getById: async (id: number): Promise<ExerciseResponse> => {
    const { data } = await apiClient.get<ExerciseResponse>(`/exercises/${id}`)
    return data
  },

  create: async (payload: CreateExercisePayload): Promise<ExerciseResponse> => {
    const { data } = await apiClient.post<ExerciseResponse>('/exercises', payload)
    return data
  },

  update: async (id: number, payload: UpdateExercisePayload): Promise<ExerciseResponse> => {
    const { data } = await apiClient.put<ExerciseResponse>(`/exercises/${id}`, payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/exercises/${id}`)
  },

  /** Multipart upload; field name must match backend multer `single('video')` */
  uploadVideo: async (id: number, file: File): Promise<ExerciseResponse> => {
    const formData = new FormData()
    formData.append('video', file)
    const { data } = await apiUploadClient.post<ExerciseResponse>(
      `/exercises/${id}/video`,
      formData,
    )
    return data
  },
}
