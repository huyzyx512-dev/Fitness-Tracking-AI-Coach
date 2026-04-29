import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workoutApi } from '@/api/workout.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { UpdateWorkoutPayload } from '@/types/workout.types'

export function useUpdateWorkout(workoutId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateWorkoutPayload) =>
      workoutApi.update(workoutId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Cập nhật buổi tập thành công!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
