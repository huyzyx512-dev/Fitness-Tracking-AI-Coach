import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { workoutApi } from '@/api/workout.api'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { CreateWorkoutPayload } from '@/types/workout.types'

export function useCreateWorkout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: CreateWorkoutPayload) => workoutApi.create(payload),
    onSuccess: ({ workout }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKOUTS() })
      toast.success('Tạo buổi tập thành công!')
      navigate(ROUTES.WORKOUT_DETAIL(workout.id))
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
