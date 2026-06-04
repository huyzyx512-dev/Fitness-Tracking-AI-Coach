import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workoutApi } from '@/api/workout.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { AddExercisePayload, UpdateExerciseInWorkoutPayload } from '@/types/workout.types'

export function useAddExerciseToWorkout(workoutId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ exerciseId, payload }: { exerciseId: number; payload: AddExercisePayload }) =>
      workoutApi.addExercise(workoutId, exerciseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Đã thêm bài tập')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useUpdateExerciseInWorkout(workoutId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      exerciseId,
      payload,
    }: {
      exerciseId: number
      payload: UpdateExerciseInWorkoutPayload
    }) => workoutApi.updateExercise(workoutId, exerciseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Đã cập nhật bài tập')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useRemoveExerciseFromWorkout(workoutId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutExerciseId: number) =>
      workoutApi.removeExercise(workoutId, workoutExerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Đã xóa bài tập khỏi buổi tập')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
