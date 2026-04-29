/* ─── Auth & User ───────────────────────────────────────── */

export interface Role {
  id: number
  name: 'ADMIN' | 'USER' | 'COACH'
}

export interface User {
  id: number
  email: string
  name: string
  weight: number | null
  height: number | null
  gender: 'nam' | 'nữ' | 'khác' | null
  date_of_birth: string | null
  role_id: number
  role: Role
  createdAt: string
  updatedAt: string
}

/* ─── Request payloads ──────────────────────────────────── */

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  birthday: string          // backend field name + required
  weight: number            // required
  height: number            // required
  gender: 'nam' | 'nữ' | 'khác'
}

export interface UpdateUserPayload {
  name?: string
  weight?: number
  height?: number
  gender?: 'nam' | 'nữ' | 'khác'
  date_of_birth?: string    // backend uses date_of_birth for update
}

/* ─── Response shapes ───────────────────────────────────── */

export interface LoginResponse {
  message: string
  accessToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface UserResponse {
  user: User
}
