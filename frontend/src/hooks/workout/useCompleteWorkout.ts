import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workoutApi } from '@/api/workout.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useCompleteWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => workoutApi.complete(id),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUT_LOGS() })
      toast.success(
        `Hoàn thành! ${data.duration} phút · ${data.calories} kcal`,
      )
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
