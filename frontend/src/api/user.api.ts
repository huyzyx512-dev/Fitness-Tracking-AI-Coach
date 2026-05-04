import { apiClient } from './axios'
import type { UserResponse, UpdateUserPayload } from '@/types/auth.types'
import type {
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserResponse,
} from '@/types/admin-user.types'

export const userApi = {
  getMe: async (): Promise<UserResponse> => {
    const { data } = await apiClient.get<UserResponse>('/user')
    return data
  },

  updateMe: async (payload: UpdateUserPayload): Promise<UserResponse> => {
    const { data } = await apiClient.patch<UserResponse>('/user', payload)
    return data
  },

  getAdminUsers: async (params: AdminUserListParams): Promise<AdminUserListResponse> => {
    const { data } = await apiClient.get<AdminUserListResponse>('/user/admin/users', {
      params: {
        search: params.search || undefined,
        role: params.role || undefined,
        status: params.status || undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      },
    })
    return data
  },

  updateAdminUserStatus: async (
    id: number,
    status: 'active' | 'locked',
  ): Promise<AdminUserResponse> => {
    const { data } = await apiClient.patch<AdminUserResponse>(
      `/user/admin/users/${id}/status`,
      { status },
    )
    return data
  },

  updateAdminUserRole: async (
    id: number,
    role: 'ADMIN' | 'USER' | 'COACH',
  ): Promise<AdminUserResponse> => {
    const { data } = await apiClient.patch<AdminUserResponse>(
      `/user/admin/users/${id}/role`,
      { role },
    )
    return data
  },
}
