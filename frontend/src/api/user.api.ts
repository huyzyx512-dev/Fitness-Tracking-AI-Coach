import { apiClient } from './axios'
import type { UserResponse, UpdateUserPayload } from '@/types/auth.types'

export const userApi = {
  getMe: async (): Promise<UserResponse> => {
    const { data } = await apiClient.get<UserResponse>('/user')
    return data
  },

  updateMe: async (payload: UpdateUserPayload): Promise<UserResponse> => {
    const { data } = await apiClient.patch<UserResponse>('/user', payload)
    return data
  },
}
