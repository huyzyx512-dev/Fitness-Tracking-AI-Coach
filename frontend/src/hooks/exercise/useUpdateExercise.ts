import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { exerciseApi } from '@/api/exercise.api'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { UpdateExercisePayload } from '@/types/exercise.types'

type UseUpdateExerciseOptions = { skipNavigate?: boolean }

export function useUpdateExercise(exerciseId: number, options?: UseUpdateExerciseOptions) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const skipNavigate = options?.skipNavigate ?? false

  return useMutation({
    mutationFn: (payload: UpdateExercisePayload) =>
      exerciseApi.update(exerciseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EXERCISES() })
      toast.success('Cập nhật bài tập thành công!')
      if (!skipNavigate) navigate(ROUTES.EXERCISES)
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}
