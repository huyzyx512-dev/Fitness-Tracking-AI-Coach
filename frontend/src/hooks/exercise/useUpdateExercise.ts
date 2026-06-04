import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { UpdateExercisePayload } from '@/types/exercise.types'

export function useUpdateExercise(exerciseId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: UpdateExercisePayload) =>
      exerciseApi.update(exerciseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXERCISES() })
      toast.success('Cập nhật bài tập thành công!')
      navigate(ROUTES.EXERCISES)
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
