import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workoutApi } from '@/api/workout.api'
import { QUERY_KEYS } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useStartWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => workoutApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Bắt đầu buổi tập!')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
