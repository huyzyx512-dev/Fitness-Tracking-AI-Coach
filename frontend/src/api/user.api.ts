import { apiClient } from './axios'
import type { UserResponse, UpdateUserPayload } from '@/types/auth.types'
import type {
  AdminCreateUserPayload,
  AdminUserAuditListParams,
  AdminUserAuditListResponse,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserResponse,
  AdminResetPasswordResponse,
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

  createAdminUser: async (payload: AdminCreateUserPayload): Promise<AdminUserResponse> => {
    const { data } = await apiClient.post<AdminUserResponse>('/user/admin/users', payload)
    return data
  },

  updateAdminUserStatus: async (
    id: number,
    status: 'active' | 'locked',
    adminPassword: string,
  ): Promise<AdminUserResponse> => {
    const { data } = await apiClient.patch<AdminUserResponse>(
      `/user/admin/users/${id}/status`,
      { status, adminPassword },
    )
    return data
  },

  updateAdminUserRole: async (
    id: number,
    role: 'ADMIN' | 'USER' | 'COACH',
    adminPassword: string,
  ): Promise<AdminUserResponse> => {
    const { data } = await apiClient.patch<AdminUserResponse>(
      `/user/admin/users/${id}/role`,
      { role, adminPassword },
    )
    return data
  },

  resetAdminUserPassword: async (
    id: number,
    adminPassword: string,
  ): Promise<AdminResetPasswordResponse> => {
    const { data } = await apiClient.post<AdminResetPasswordResponse>(
      `/user/admin/users/${id}/reset-password`,
      { confirm: true, adminPassword },
    )
    return data
  },

  getAdminUserAuditLogs: async (
    id: number,
    params?: AdminUserAuditListParams,
  ): Promise<AdminUserAuditListResponse> => {
    const { data } = await apiClient.get<AdminUserAuditListResponse>(
      `/user/admin/users/${id}/audit`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
        },
      },
    )
    return data
  },
}
