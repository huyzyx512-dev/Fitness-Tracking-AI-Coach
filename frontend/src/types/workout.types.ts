import type { Exercise } from './exercise.types'
import type { WorkoutLog } from './workout-log.types'

/* ─── Workout domain ────────────────────────────────────── */

export type WorkoutStatus = 'pending' | 'in_progress' | 'completed'

export interface WorkoutExercise {
  id: number
  workout_id: number
  exercise_id: number
  sets: number
  reps: number
  weight: number
  comment: string | null
  order_index: number
  rest_time_seconds: number
  exercise?: Exercise
  createdAt?: string
  updatedAt?: string
}

export interface Workout {
  id: number
  title: string
  notes: string | null
  scheduled_at: string | null
  status: WorkoutStatus
  user_id: number
  started_at: string | null
  ended_at: string | null
  exercises: WorkoutExercise[]
  log: WorkoutLog | null
  createdAt: string
  updatedAt: string
}

/* ─── Request payloads ──────────────────────────────────── */

export interface CreateWorkoutPayload {
  title: string
  notes?: string
  scheduled_at?: string | null
}

export type UpdateWorkoutPayload = Partial<CreateWorkoutPayload>

export interface AddExercisePayload {
  sets?: number
  reps?: number
  weight?: number
  comment?: string
  order_index?: number
  rest_time_seconds?: number
}

export type UpdateExerciseInWorkoutPayload = Partial<AddExercisePayload>

/* ─── Response shapes ───────────────────────────────────── */

export interface WorkoutListResponse {
  workouts: Workout[]
}

export interface WorkoutResponse {
  workout: Workout
}

export interface StartWorkoutResponse {
  message: string
  data: {
    id: number
    status: WorkoutStatus
    started_at: string
  }
}

export interface CompleteWorkoutResponse {
  message: string
  data: {
    workout_id: number
    duration: number
    calories: number
  }
}
