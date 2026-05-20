export type AiGoal =
  | 'muscle_gain'
  | 'fat_loss'
  | 'endurance'
  | 'general_fitness'
  | 'other'

export type AiFitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export type AiRecommendationStatus = 'draft' | 'applied' | 'dismissed'

export interface AiAskRequest {
  message: string
  context?: {
    includeProfile?: boolean
    includeWorkoutHistory?: boolean
  }
}

export interface AiUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export interface AiAskResponse {
  answer: string
  usage?: AiUsage | null
}

export interface AiWorkoutPlanRequest {
  goal: AiGoal | string
  daysPerWeek: number
  sessionMinutes: number
  level: AiFitnessLevel
  equipment?: string[]
  startDate?: string | null
  height?: number
  weight?: number
  gender?: string
  injuryOrLimitation?: string
  notes?: string
}

export interface AiGeneratedExercise {
  exerciseId: number | null
  name: string
  description?: string
  category?: string
  primaryMuscleGroup?: string
  secondaryMuscleGroups?: string[]
  difficultyLevel?: AiFitnessLevel | string
  equipment?: string
  metValue?: number | null
  sets: number
  reps: number
  weight?: number
  restTimeSeconds?: number
  notes?: string
}

export interface AiGeneratedDay {
  dayIndex: number
  title: string
  focus?: string
  estimatedMinutes?: number
  scheduledAt?: string | null
  exercises: AiGeneratedExercise[]
}

export interface AiGeneratedPlan {
  summary?: string
  goal: AiGoal | string
  daysPerWeek: number
  sessionMinutes: number
  level: AiFitnessLevel | string
  days: AiGeneratedDay[]
}

export interface AiWorkoutPlanResponse {
  recommendationId: number
  plan: AiGeneratedPlan
  usage?: AiUsage | null
}

export interface AiWorkoutRecommendationSummary {
  id: number
  goal: AiGoal | string
  daysPerWeek: number
  sessionMinutes: number
  level: AiFitnessLevel | string
  equipment?: string[] | null
  status: AiRecommendationStatus | string
  appliedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface AiWorkoutRecommendationDetail extends AiWorkoutRecommendationSummary {
  generatedPlan: AiGeneratedPlan
}

export interface AiRecommendationsResponse {
  recommendations: AiWorkoutRecommendationSummary[]
}

export interface AiRecommendationDetailResponse {
  recommendation: AiWorkoutRecommendationDetail
}

export interface AiApplyRecommendationRequest {
  selectedDayIndexes: number[]
  editedPlan?: AiGeneratedPlan
}

export interface AiApplyRecommendationResponse {
  message: string
  workoutIds: number[]
}
