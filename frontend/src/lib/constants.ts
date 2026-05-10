/* ─── Client-side Routes ─────────────────────────────────── */
export const ROUTES = {
  LOGIN:           '/login',
  REGISTER:        '/register',
  DASHBOARD:       '/',
  WORKOUTS:        '/workouts',
  WORKOUT_NEW:     '/workouts/new',
  WORKOUT_DETAIL:  (id: number | string) => `/workouts/${id}`,
  WORKOUT_EDIT:    (id: number | string) => `/workouts/${id}/edit`,
  EXERCISES:       '/exercises',
  EXERCISE_DETAIL: (id: number | string) => `/exercises/${id}`,
  LOGS:            '/logs',
  PROFILE:         '/profile',
  BILLING:         '/billing',
  BILLING_ORDER:   (id: number | string) => `/billing/orders/${id}`,
  ADMIN_ROOT:      '/admin',
  ADMIN_USERS:     '/admin/users',
  ADMIN_USER_NEW:  '/admin/users/new',
  ADMIN_USER_DETAIL_PATH: '/admin/users/:id',
  ADMIN_USER_DETAIL: (id: number | string) => `/admin/users/${id}`,
  NOT_FOUND:       '/404',
  FORBIDDEN:       '/403',
  SERVER_ERROR:    '/500',
} as const

/* ─── API Endpoints ──────────────────────────────────────── */
export const API_ENDPOINTS = {
  // Auth
  LOGIN:           '/auth/login',
  REGISTER:        '/auth/register',
  LOGOUT:          '/auth/logout',
  REFRESH_TOKEN:   '/auth/refresh-token',

  // User
  ME:              '/user',
  ADMIN_USERS:     '/user/admin/users',
  ADMIN_USER:      (id: number | string) => `/user/admin/users/${id}`,
  ADMIN_USER_STATUS: (id: number | string) => `/user/admin/users/${id}/status`,
  ADMIN_USER_ROLE:   (id: number | string) => `/user/admin/users/${id}/role`,
  ADMIN_USERS_BULK_STATUS: '/user/admin/users/bulk-status',
  ADMIN_USERS_BULK_ROLE: '/user/admin/users/bulk-role',
  ADMIN_USER_RESET_PASSWORD: (id: number | string) => `/user/admin/users/${id}/reset-password`,
  ADMIN_USER_FORCE_LOGOUT: (id: number | string) => `/user/admin/users/${id}/force-logout`,
  ADMIN_USER_AUDIT: (id: number | string) => `/user/admin/users/${id}/audit`,

  // Workouts
  WORKOUTS:        '/workouts',
  WORKOUT:         (id: number | string) => `/workouts/${id}`,
  WORKOUT_START:   (id: number | string) => `/workouts/${id}/start`,
  WORKOUT_COMPLETE:(id: number | string) => `/workouts/${id}/complete`,
  WORKOUT_ADD_EXERCISE: (workoutId: number | string, exerciseId: number | string) =>
    `/workouts/${workoutId}/exercise/${exerciseId}`,
  WORKOUT_UPDATE_EXERCISE: (workoutId: number | string, exerciseId: number | string) =>
    `/workouts/${workoutId}/exercise/${exerciseId}`,
  WORKOUT_REMOVE_EXERCISE: (workoutId: number | string, weId: number | string) =>
    `/workouts/${workoutId}/workout-exercise/${weId}`,

  // Exercises
  EXERCISES:       '/exercises',
  EXERCISE:        (id: number | string) => `/exercises/${id}`,

  // Workout Logs
  WORKOUT_LOGS:    '/workout-logs',

  // Billing
  BILLING_PLANS:        '/billing/plans',
  BILLING_SUBSCRIPTION: '/billing/subscription',
  BILLING_ORDERS:       '/billing/orders',
  BILLING_ORDER:        (id: number | string) => `/billing/orders/${id}`,
} as const

/* ─── TanStack Query Keys ────────────────────────────────── */
export const QUERY_KEYS = {
  ME:           ['me'] as const,
  ADMIN_USERS:  (params?: object) => params ? ['admin-users', params] : ['admin-users'],
  ADMIN_USER:   (id: number | string) => ['admin-users', id] as const,
  ADMIN_USER_AUDIT: (id: number | string, params?: object) =>
    params ? (['admin-user-audit', id, params] as const) : (['admin-user-audit', id] as const),
  WORKOUTS:     (params?: object) => params ? ['workouts', params] : ['workouts'],
  WORKOUT:      (id: number | string) => ['workouts', id] as const,
  EXERCISES:    (params?: object) => params ? ['exercises', params] : ['exercises'],
  EXERCISE:     (id: number | string) => ['exercises', id] as const,
  WORKOUT_LOGS: (params?: object) => params ? ['workout-logs', params] : ['workout-logs'],
  BILLING_PLANS:        ['billing', 'plans'] as const,
  BILLING_SUBSCRIPTION: ['billing', 'subscription'] as const,
  BILLING_ORDER:        (id: number | string) => ['billing', 'orders', id] as const,
} as const

/* ─── Domain Enums ───────────────────────────────────────── */
export const WORKOUT_STATUS = {
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
} as const

export const WORKOUT_STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ tập',
  in_progress: 'Đang tập',
  completed:   'Hoàn thành',
}

export const DIFFICULTY = {
  CO_BAN:      'cơ bản',
  TRUNG_BINH:  'trung bình',
  NANG_CAO:    'nâng cao',
} as const

export const DIFFICULTY_LABELS: Record<string, string> = {
  'cơ bản':     'Cơ bản',
  'trung bình': 'Trung bình',
  'nâng cao':   'Nâng cao',
}

export const GENDER = {
  male:  'nam',
  female:   'nữ',
  other: 'khác',
} as const

export const GENDER_LABELS: Record<string, string> = {
  'male':  'Nam',
  'female':   'Nữ',
  'other': 'Khác',
}

export const ROLE = {
  ADMIN: 'ADMIN',
  USER:  'USER',
  COACH: 'COACH',
} as const

/* ─── Pagination defaults ────────────────────────────────── */
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50]
