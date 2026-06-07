import { apiClient } from './axios'
import type { UserResponse, UpdateUserPayload } from '@/types/auth.types'
import { API_ENDPOINTS } from '@/lib/constants'
import type {
  AdminBulkActionResult,
  AdminCreateUserPayload,
  AdminForceLogoutResponse,
  AdminUserAuditListParams,
  AdminUserAuditListResponse,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserResponse,
  AdminResetPasswordResponse,
} from '@/types/admin-user.types'

export const userApi = {
  getMe: async (): Promise<UserResponse> => {
    const { data } = await apiClient.get<UserResponse>(API_ENDPOINTS.ME)
    return data
  },

  updateMe: async (payload: UpdateUserPayload): Promise<UserResponse> => {
    const { data } = await apiClient.patch<UserResponse>(API_ENDPOINTS.ME, payload)
    return data
  },

  getAdminUsers: async (params: AdminUserListParams): Promise<AdminUserListResponse> => {
    const { data } = await apiClient.get<AdminUserListResponse>(API_ENDPOINTS.ADMIN_USERS, {
      params: {
        search: params.search || undefined,
        role: params.role || undefined,
        status: params.status || undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy || undefined,
        order: params.order || undefined,
      },
    })
    return data
  },

  createAdminUser: async (payload: AdminCreateUserPayload): Promise<AdminUserResponse> => {
    const { data } = await apiClient.post<AdminUserResponse>(API_ENDPOINTS.ADMIN_USERS, payload)
    return data
  },

  getAdminUserById: async (id: number): Promise<AdminUserResponse> => {
    const { data } = await apiClient.get<AdminUserResponse>(API_ENDPOINTS.ADMIN_USER(id))
    return data
  },

  updateAdminUserStatus: async (
    id: number,
    status: 'active' | 'locked',
    adminPassword: string,
  ): Promise<AdminUserResponse> => {
    const { data } = await apiClient.patch<AdminUserResponse>(
      API_ENDPOINTS.ADMIN_USER_STATUS(id),
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
      API_ENDPOINTS.ADMIN_USER_ROLE(id),
      { role, adminPassword },
    )
    return data
  },

  updateAdminUsersBulkStatus: async (
    userIds: number[],
    status: 'active' | 'locked',
    adminPassword: string,
  ): Promise<AdminBulkActionResult> => {
    const { data } = await apiClient.patch<AdminBulkActionResult>(
      API_ENDPOINTS.ADMIN_USERS_BULK_STATUS,
      { userIds, status, adminPassword },
    )
    return data
  },

  updateAdminUsersBulkRole: async (
    userIds: number[],
    role: 'ADMIN' | 'USER' | 'COACH',
    adminPassword: string,
  ): Promise<AdminBulkActionResult> => {
    const { data } = await apiClient.patch<AdminBulkActionResult>(
      API_ENDPOINTS.ADMIN_USERS_BULK_ROLE,
      { userIds, role, adminPassword },
    )
    return data
  },

  resetAdminUserPassword: async (
    id: number,
    adminPassword: string,
  ): Promise<AdminResetPasswordResponse> => {
    const { data } = await apiClient.post<AdminResetPasswordResponse>(
      API_ENDPOINTS.ADMIN_USER_RESET_PASSWORD(id),
      { confirm: true, adminPassword },
    )
    return data
  },

  forceLogoutAdminUser: async (
    id: number,
    adminPassword: string,
  ): Promise<AdminForceLogoutResponse> => {
    const { data } = await apiClient.post<AdminForceLogoutResponse>(
      API_ENDPOINTS.ADMIN_USER_FORCE_LOGOUT(id),
      { confirm: true, adminPassword },
    )
    return data
  },

  getAdminUserAuditLogs: async (
    id: number,
    params?: AdminUserAuditListParams,
  ): Promise<AdminUserAuditListResponse> => {
    const { data } = await apiClient.get<AdminUserAuditListResponse>(
      API_ENDPOINTS.ADMIN_USER_AUDIT(id),
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
