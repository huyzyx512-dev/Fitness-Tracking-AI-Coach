import type { User } from './auth.types'

export type AdminUserStatus = 'active' | 'locked'

export interface AdminUser extends User {
  status: AdminUserStatus
}

export interface AdminUserListParams {
  search?: string
  role?: 'ADMIN' | 'USER' | 'COACH' | ''
  status?: AdminUserStatus | ''
  page?: number
  limit?: number
}

export interface AdminUserListResponse {
  users: AdminUser[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface AdminUserResponse {
  user: AdminUser
  message?: string
}
