import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { workoutApi } from '@/api/workout.api'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function useDeleteWorkout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (id: number) => workoutApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Đã xóa buổi tập')
      navigate(ROUTES.WORKOUTS)
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
