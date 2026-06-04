/* ─── WorkoutLog domain ─────────────────────────────────── */

export interface WorkoutLog {
  id: number
  workout_id: number
  completed_at: string
  duration_minutes: number
  calories_burned: number
  comment: string | null
  workout?: {
    id: number
    title: string
    scheduled_at: string | null
  }
  createdAt: string
  updatedAt: string
}

/* ─── Request payloads ──────────────────────────────────── */

export interface CreateWorkoutLogPayload {
  workout_id: number
  completed_at?: string
  duration_minutes?: number
  calories_burned?: number
  comment?: string
}

/* ─── Response shapes ───────────────────────────────────── */

export interface WorkoutLogListResponse {
  workoutLogs: WorkoutLog[]
}

export interface WorkoutLogResponse {
  workoutLog: WorkoutLog
}
