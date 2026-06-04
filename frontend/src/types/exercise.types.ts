/* ─── Exercise domain ───────────────────────────────────── */

/* Must match backend exerciseValidator enum */
export type DifficultyLevel = 'cơ bản' | 'trung bình' | 'nâng cao'

export interface Category {
  id: number
  name: string
  description: string | null
  createdAt?: string
  updatedAt?: string
}

export interface MuscleGroup {
  id: number
  name: string
  ExerciseMuscle?: {
    is_primary: boolean
  }
}

export interface ExerciseCreator {
  id: number
  name: string
}

export interface Exercise {
  id: number
  name: string
  description: string | null
  category_id: number | null
  created_by: number
  difficulty_level: DifficultyLevel
  equipment: string | null
  met_value: number
  video_url: string | null
  thumbnail_url: string | null
  category: Category | null
  muscleGroups: MuscleGroup[]
  creator: ExerciseCreator
  createdAt: string
  updatedAt: string
}

/* ─── Request payloads ──────────────────────────────────── */

export interface CreateExercisePayload {
  name: string
  description: string         // required by backend
  category_id: number         // required by backend
  muscle_group_ids: number[]  // required by backend, min 1
  difficulty_level: DifficultyLevel
  equipment: string           // required by backend
  met_value?: number
  video_url?: string | null
  thumbnail_url?: string | null
}

export type UpdateExercisePayload = Partial<CreateExercisePayload>

/* ─── Response shapes ───────────────────────────────────── */

export interface ExerciseListResponse {
  exercises: Exercise[]
}

export interface ExerciseResponse {
  exercise: Exercise
}
