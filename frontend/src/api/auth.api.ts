import { apiClient } from './axios'
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RefreshTokenResponse,
} from '@/types/auth.types'

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
    return data
  },

  register: async (payload: RegisterPayload): Promise<void> => {
    await apiClient.post('/auth/register', payload)
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const { data } = await apiClient.post<RefreshTokenResponse>('/auth/refresh-token')
    return data
  },
}
