import { z } from 'zod'

/** Mirrors backend `workoutExerciseSchema` field rules for add-to-workout payloads */
export const exerciseConfigSchema = z.object({
  sets: z.coerce.number().int().positive(),
  reps: z.coerce.number().int().positive(),
  weight: z.coerce.number().min(0).default(0),
  rest_time_seconds: z.coerce.number().int().min(0).default(60),
  comment: z.string().trim().max(1000).optional().default(''),
})

export type ExerciseConfigFormValues = z.infer<typeof exerciseConfigSchema>

export const EXERCISE_CONFIG_ADD_DEFAULTS: ExerciseConfigFormValues = {
  sets: 3,
  reps: 10,
  weight: 0,
  rest_time_seconds: 60,
  comment: '',
}
