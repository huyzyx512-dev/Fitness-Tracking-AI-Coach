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
  gender: 'male' | 'female' | 'other' | null
  date_of_birth: string | null
  role_id: number
  role: Role
  subscription_tier: string
  subscription_expires_at: string | null
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
  gender: 'male' | 'female' | 'other'
}

export interface UpdateUserPayload {
  name?: string
  weight?: number
  height?: number
  gender?: 'male' | 'female' | 'other'
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
