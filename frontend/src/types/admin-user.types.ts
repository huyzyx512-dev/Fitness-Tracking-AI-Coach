import type { User } from './auth.types'

export type AdminUserStatus = 'active' | 'locked'

export interface AdminUser extends User {
  status: AdminUserStatus
  lastLoginAt: string | null
}

export interface AdminUserListParams {
  search?: string
  role?: 'ADMIN' | 'USER' | 'COACH' | ''
  status?: AdminUserStatus | ''
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'name' | 'email' | 'lastLoginAt'
  order?: 'asc' | 'desc'
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

export interface AdminCreateUserPayload {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'USER' | 'COACH'
  adminPassword: string
}

export interface AdminResetPasswordResponse {
  user: AdminUser
  message?: string
  temporaryPassword: string
}

export interface AdminForceLogoutResponse {
  message: string
}

export interface AdminBulkActionResult {
  message: string
  succeeded: number[]
  failed: Array<{ id: number; reason: string }>
}

export type AdminAuditAction =
  | 'USER_STATUS_CHANGED'
  | 'USER_ROLE_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'USER_CREATED'
  | 'USER_LOGIN'
  | 'USER_FORCE_LOGOUT'

export interface AdminAuditLogActor {
  id: number
  name: string | null
  email: string
}

export interface AdminAuditLogEntry {
  id: number
  /** Server-defined action code (extend `AdminAuditAction` as new actions are added). */
  action: string
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: AdminAuditLogActor | null
}

export interface AdminUserAuditListParams {
  page?: number
  limit?: number
}

export interface AdminUserAuditListResponse {
  logs: AdminAuditLogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}
