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
  /** Optional: when API provides planned duration per exercise */
  duration_minutes?: number | null
  /** Optional: when API provides estimated calories per exercise */
  calories_burned?: number | null
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
  description?: string
  category_id?: number
  muscle_group_ids?: number[]
  difficulty_level: DifficultyLevel
  equipment?: string
  met_value?: number
  video_url?: string | null
  thumbnail_url?: string | null
}

export type UpdateExercisePayload = Partial<CreateExercisePayload>

/* ─── Response shapes ───────────────────────────────────── */

export interface ExerciseListResponse {
  exercises: Exercise[]
}

export interface ExerciseListFilters {
  muscle_group_ids?: number[]
  muscle_match?: 'any' | 'all'
}

export interface ExerciseResponse {
  exercise: Exercise
}
